import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from typing import Dict, Any, List

def forecast_prices(df: pd.DataFrame, days_to_predict: int = 14) -> Dict[str, Any]:
    """
    Trains a Gradient Boosting Regressor on the fly to predict future prices.
    Uses technical indicators as features.
    
    WARNING: For educational purposes only. Not financial advice.
    """
    if df is None or len(df) < 50:
        return {"error": "Not enough data to generate forecast."}
        
    try:
        # Create a copy so we don't modify the original
        data = df.copy()
        
        # Feature engineering
        data['Returns'] = data['close'].pct_change()
        data['SMA_10'] = data['close'].rolling(window=10).mean()
        data['SMA_30'] = data['close'].rolling(window=30).mean()
        data['Volatility'] = data['Returns'].rolling(window=20).std()
        
        # Target variable: Next day's price
        data['Target'] = data['close'].shift(-1)
        
        # Drop NaNs
        data = data.dropna()
        
        features = ['close', 'Returns', 'SMA_10', 'SMA_30', 'Volatility']
        X = data[features].values
        y = data['Target'].values
        
        if len(X) < 10:
            return {"error": "Not enough valid data after feature engineering."}
            
        # Train model
        model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
        model.fit(X, y)
        
        # Iterative prediction for `days_to_predict`
        predictions: List[float] = []
        last_row = data.iloc[-1].copy()
        
        # We need a dynamic list of past close prices to update moving averages
        # To keep it simple, we will just iteratively use the model's prediction 
        # as the next 'close' and approximate the indicators or keep them static for short term.
        # A more rigorous approach updates SMA iteratively.
        
        current_close = last_row['close']
        history_closes = list(data['close'].values[-30:])
        
        for _ in range(days_to_predict):
            # Recalculate features based on history
            returns = (current_close - history_closes[-2]) / history_closes[-2] if len(history_closes) >= 2 else 0
            sma_10 = np.mean(history_closes[-10:]) if len(history_closes) >= 10 else current_close
            sma_30 = np.mean(history_closes[-30:]) if len(history_closes) >= 30 else current_close
            volatility = np.std([ (history_closes[i] - history_closes[i-1])/history_closes[i-1] for i in range(-20, 0) ]) if len(history_closes) >= 21 else 0
            
            x_pred = np.array([[current_close, returns, sma_10, sma_30, volatility]])
            next_pred = model.predict(x_pred)[0]
            
            predictions.append(round(next_pred, 4))
            
            # Update for next iteration
            history_closes.append(next_pred)
            current_close = next_pred
            
        # Generate future dates
        last_date = df.index[-1]
        future_dates = []
        current_date = last_date
        
        # Add trading days (skipping weekends)
        days_added = 0
        while days_added < days_to_predict:
            current_date += pd.Timedelta(days=1)
            if current_date.weekday() < 5: # 0-4 are Monday-Friday
                future_dates.append(current_date.strftime("%Y-%m-%d"))
                days_added += 1
                
        # Format the output
        forecast_data = []
        for i in range(days_to_predict):
            forecast_data.append({
                "date": future_dates[i],
                "predicted_price": predictions[i]
            })
            
        # Calculate trend
        trend_pct = ((predictions[-1] - df['close'].iloc[-1]) / df['close'].iloc[-1]) * 100
        
        return {
            "forecast": forecast_data,
            "trend_pct": round(trend_pct, 2),
            "days_predicted": days_to_predict,
            "current_price": round(df['close'].iloc[-1], 2),
            "target_price": round(predictions[-1], 2)
        }
        
    except Exception as e:
        print(f"Error generating forecast: {e}")
        return {"error": str(e)}
