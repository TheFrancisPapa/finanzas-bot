import yfinance as yf
import json

def test_yf(ticker):
    print("--- Yahoo Finance ---")
    try:
        t = yf.Ticker(ticker)
        news = t.news
        if len(news) > 0:
            print(json.dumps(news[0], indent=2))
    except Exception as e:
        print("YF Error:", e)

test_yf("AAPL")
