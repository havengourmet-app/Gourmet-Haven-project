import { useEffect, useState } from "react";
import { fetchRestaurantReviews } from "../../services/reviewService";

function StarDisplay({ rating, size = "sm" }) {
  const sizeClass = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-amber-400" : "text-slate-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

function RatingBreakdown({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="card-surface p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* big avg */}
        <div className="flex flex-col items-center gap-1 sm:w-32">
          <span className="text-5xl font-semibold text-[#1a1a1a]">{avg}</span>
          <StarDisplay rating={Math.round(Number(avg))} size="lg" />
          <span className="text-xs text-slate-400">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
        </div>

        {/* bar breakdown */}
        <div className="flex-1 space-y-2">
          {counts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="w-3 text-xs text-slate-500">{star}</span>
              <span className="text-amber-400 text-sm">★</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-4 text-xs text-slate-400 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = review.customer?.full_name
    ? review.customer.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#e8f9eb] text-sm font-semibold text-[#01de1a]">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">
              {review.customer?.full_name || "Customer"}
            </p>
            <p className="text-xs text-slate-400">{date}</p>
          </div>
        </div>
        <StarDisplay rating={review.rating} />
      </div>

      {review.comment && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
      )}
    </div>
  );
}

export default function RestaurantReviews({ restaurantId, avgRating }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!restaurantId) return;

    setLoading(true);
    setError("");

    fetchRestaurantReviews(restaurantId)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Unable to load reviews."))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-24 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-surface p-6 text-sm text-rose-700">{error}</div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="text-3xl">🌟</p>
        <p className="mt-3 font-semibold text-[#1a1a1a]">No reviews yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Be the first to review after your order is delivered.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Customer feedback</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Reviews</h2>
      </div>

      <RatingBreakdown reviews={reviews} />

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}