#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Booth商品検索スクリプト
ファイル名から商品を検索してJSONで結果を返す
"""

import sys
import json
import re
import time
import urllib.parse
import urllib.request
from urllib.error import URLError, HTTPError
from bs4 import BeautifulSoup

def extract_keywords(filename):
    """ファイル名からキーワードを抽出"""
    # 拡張子を除去
    name = re.sub(r'\.(unitypackage|zip|rar)$', '', filename, flags=re.IGNORECASE)
    
    # よくあるパターンを除去
    name = re.sub(r'_?v?\d+\.\d+.*$', '', name, flags=re.IGNORECASE)  # バージョン番号
    name = re.sub(r'_?\d{8}.*$', '', name)  # 日付（YYYYMMDD）
    name = re.sub(r'_?fix.*$', '', name, flags=re.IGNORECASE)  # fix
    name = re.sub(r'_?final.*$', '', name, flags=re.IGNORECASE)  # final
    name = re.sub(r'[\[\]()（）]', '', name)  # 括弧
    name = re.sub(r'[_-]+', ' ', name)  # アンダースコアとハイフンをスペースに
    name = name.strip()
    
    # 複数のキーワードに分割
    keywords = [word for word in name.split() if len(word) > 1]
    return keywords

def search_booth(query):
    """Booth検索を実行"""
    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://booth.pm/ja/search/{encoded_query}"
        
        # ユーザーエージェントを設定
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8')
            
        # BeautifulSoupでパース
        soup = BeautifulSoup(html, 'html.parser')
        
        results = []
        
        # Booth商品のリンクを探す
        # 複数のセレクターを試行
        selectors = [
            'a[href*="/items/"]',
            '.item-card a',
            '.product-item a',
            'a[href*="booth.pm/items/"]'
        ]
        
        for selector in selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href', '')
                if '/items/' in href and href not in [r['url'] for r in results]:
                    # 相対URLを絶対URLに変換
                    if href.startswith('/'):
                        href = 'https://booth.pm' + href
                    elif not href.startswith('http'):
                        continue
                    
                    # タイトルを取得
                    title_elem = link.find(['h2', 'h3', '.title', '.item-title'])
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                    else:
                        title = link.get_text(strip=True)
                        if not title:
                            title = f"商品 {href.split('/')[-1]}"
                    
                    results.append({
                        'url': href,
                        'title': title,
                        'query': query
                    })
                    
                    if len(results) >= 5:  # 最大5件
                        break
            
            if results:  # 結果が見つかったら他のセレクターは試さない
                break
        
        return results
        
    except Exception as e:
        print(f"検索エラー ({query}): {e}", file=sys.stderr)
        return []

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'ファイル名が指定されていません',
            'results': [],
            'keywords': []
        }))
        return
    
    filename = sys.argv[1]
    
    try:
        # キーワード抽出
        keywords = extract_keywords(filename)
        
        if not keywords:
            print(json.dumps({
                'success': False,
                'error': 'キーワードを抽出できませんでした',
                'results': [],
                'keywords': []
            }))
            return
        
        all_results = []
        
        # 複数の検索戦略
        search_queries = [
            ' '.join(keywords),  # 全キーワード
            keywords[0],  # 最初のキーワード
            ' '.join(keywords[:2]) if len(keywords) >= 2 else keywords[0]  # 最初の2つ
        ]
        
        for query in search_queries:
            results = search_booth(query)
            all_results.extend(results)
            
            # 重複チェックしながら結果を追加
            if len(all_results) >= 10:
                break
            
            # リクエスト間隔
            time.sleep(1)
        
        # 重複を除去
        unique_results = []
        seen_urls = set()
        for result in all_results:
            if result['url'] not in seen_urls:
                unique_results.append(result)
                seen_urls.add(result['url'])
        
        print(json.dumps({
            'success': True,
            'results': unique_results[:10],  # 最大10件
            'keywords': keywords
        }, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'処理エラー: {str(e)}',
            'results': [],
            'keywords': []
        }))

if __name__ == '__main__':
    main()