"""Service layer for Market Reference Prices."""
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.market_price import MarketPrice

# Seed data for demo / reference pricing (Source explicitly disclaims live data)
DEMO_PRICES = [
    {"crop_name": "Tomato", "market_name": "Koyambedu Wholesale Market, Chennai", "price_per_kg": 34.0},
    {"crop_name": "Onion", "market_name": "Koyambedu Wholesale Market, Chennai", "price_per_kg": 28.0},
    {"crop_name": "Potato", "market_name": "Koyambedu Wholesale Market, Chennai", "price_per_kg": 25.0},
    {"crop_name": "Rice", "market_name": "Thanjavur Mandi, Thanjavur", "price_per_kg": 48.0},
    {"crop_name": "Banana", "market_name": "Gandhi Market, Trichy", "price_per_kg": 35.0},
    {"crop_name": "Chilli", "market_name": "Guntur / Madurai Mandi", "price_per_kg": 60.0},
    {"crop_name": "Brinjal", "market_name": "Koyambedu Wholesale Market, Chennai", "price_per_kg": 26.0},
    {"crop_name": "Carrot", "market_name": "Mettupalayam Mandi, Nilgiris", "price_per_kg": 42.0},
]

DEMO_SOURCE = "Demo Mandi Reference Data - AGROFLOW Price Index (Non-Live Reference)"


class MarketPriceService:
    """Manages retrieval and seeding of benchmark commodity market prices."""

    @staticmethod
    def ensure_seeded_prices(db: Session, target_date: Optional[date] = None) -> None:
        """Seed demo market reference prices for the given date if none exist."""
        today = target_date or date.today()
        count = db.query(MarketPrice).filter(MarketPrice.rate_date == today).count()
        if count == 0:
            for item in DEMO_PRICES:
                mp = MarketPrice(
                    crop_name=item["crop_name"],
                    market_name=item["market_name"],
                    price_per_kg=item["price_per_kg"],
                    source=DEMO_SOURCE,
                    rate_date=today,
                )
                db.add(mp)
            db.commit()

    @staticmethod
    def get_today_prices(db: Session) -> List[MarketPrice]:
        """Fetch all reference market prices for today (auto-seeding if empty)."""
        today = date.today()
        MarketPriceService.ensure_seeded_prices(db, today)
        return (
            db.query(MarketPrice)
            .filter(MarketPrice.rate_date == today)
            .order_by(MarketPrice.crop_name.asc())
            .all()
        )

    @staticmethod
    def get_today_price_by_crop(db: Session, crop_name: str) -> Optional[MarketPrice]:
        """Fetch reference market price for a specific crop for today."""
        today = date.today()
        MarketPriceService.ensure_seeded_prices(db, today)
        return (
            db.query(MarketPrice)
            .filter(
                MarketPrice.rate_date == today,
                MarketPrice.crop_name.ilike(crop_name.strip()),
            )
            .first()
        )


market_price_service = MarketPriceService()
