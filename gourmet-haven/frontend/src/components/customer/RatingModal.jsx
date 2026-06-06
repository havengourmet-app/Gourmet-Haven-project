import { useState } from "react";
import { submitReview } from "../../services/reviewService";

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const labels = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`text-3xl transition-transform ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${star <= display ? "text-amber-400" : "text-slate-200"}`}
            aria-label={`Rate ${star} out of 5`}
          >
            ★
          </button>
        ))}
      </div>
      {!readonly && display > 0 && (
        <p className="text-sm text-slate-500">{labels[display - 1]}</p>
      )}
    </div>
  );
}

export default function RatingModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({
        orderId: order.id,
        restaurantId: order.restaurant_id || order.restaurant?.id,
        rating,
        comment
      });
      onSubmitted?.();
    } catch (err) {
      setError(err.message || "Unable to submit review right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Rate your order</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1a1a1a]">
              {order.restaurant?.name || "How was your order?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <p className="mb-3 text-sm text-slate-500">Tap a star to rate</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">
              Leave a comment <span className="text-slate-400">(optional)</span>
            </span>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the food and delivery experience?"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/500</p>
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit review"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/10 px-5 py-3 text-sm text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}