import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict, Any

# Initialize the VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(ticker: str) -> Dict[str, Any]:
    """
    Fetches recent news for the ticker using yfinance and calculates an average sentiment score using VADER.
    Score ranges from -1 (very bearish) to 1 (very bullish).
    """
    try:
        t = yf.Ticker(ticker)
        news = t.news
        
        if not news:
            return {
                "score": 0.0,
                "label": "NEUTRAL",
                "news_count": 0,
                "articles": []
            }
            
        total_score = 0.0
        articles = []
        
        for item in news:
            # We combine title and summary (if available) for better context
            title = item.get("title", "")
            summary = item.get("summary", "")
            text_to_analyze = f"{title}. {summary}"
            
            # VADER returns a dictionary with pos, neg, neu, and compound
            sentiment_dict = analyzer.polarity_scores(text_to_analyze)
            compound_score = sentiment_dict['compound']
            
            total_score += compound_score
            
            # Determine label for individual article
            label = "NEUTRAL"
            if compound_score >= 0.05:
                label = "BULLISH"
            elif compound_score <= -0.05:
                label = "BEARISH"
                
            articles.append({
                "title": title,
                "link": item.get("link", ""),
                "publisher": item.get("publisher", ""),
                "providerPublishTime": item.get("providerPublishTime", 0),
                "sentiment_score": compound_score,
                "sentiment_label": label
            })
            
        avg_score = total_score / len(news)
        
        overall_label = "NEUTRAL"
        if avg_score >= 0.1:
            overall_label = "BULLISH"
        elif avg_score <= -0.1:
            overall_label = "BEARISH"
            
        return {
            "score": round(avg_score, 4),
            "label": overall_label,
            "news_count": len(news),
            "articles": articles
        }
    except Exception as e:
        print(f"Error fetching sentiment for {ticker}: {e}")
        return {
            "score": 0.0,
            "label": "NEUTRAL",
            "news_count": 0,
            "articles": [],
            "error": str(e)
        }
