import urllib.request
import urllib.parse
import json
import re

def search_news(ticker):
    print(f"--- Search News via Yahoo Finance API for {ticker} ---")
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(ticker)}&quotesCount=0&newsCount=10"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            news = data.get('news', [])
            print(f"Found {len(news)} news")
            for n in news[:3]:
                print(f"- {n.get('title')}")
                
    except Exception as e:
        print("Error:", e)
        
search_news("BTC-USD")
search_news("AAPL")
