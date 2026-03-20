import asyncio
import yfinance as yf
import traceback

async def main():
    ticker = "SPY"
    ticker_obj = yf.Ticker(ticker.upper())
    try:
        news = await asyncio.to_thread(lambda: ticker_obj.news)
        print("Success!", len(news))
    except Exception as e:
        print("Error!")
        traceback.print_exc()

asyncio.run(main())
