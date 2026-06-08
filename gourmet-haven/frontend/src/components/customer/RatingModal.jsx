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
            className={`text-3xl transition-transform ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
            style={{ color: star <= display ? "#f59e0b" : "var(--border)" }}
            aria-label={`Rate ${star} out of 5`}
          >
            ★
          </button>
        ))}
      </div>
      {!readonly && display > 0 && (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>{labels[display - 1]}</p>
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
    if (rating === 0) { setError("Please select a star rating."); return; }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-xs">Rate your experience</p>
            <h2 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>
              {order.restaurant?.name || "How was your order?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-8 w-8 p-0 flex items-center justify-center rounded-lg"
            style={{ color: "var(--ink-muted)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <p className="input-label mb-3">Tap a star to rate</p>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="input-label">
              Comment <span style={{ color: "var(--ink-muted)" }}>(optional)</span>
            </label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the food and delivery?"
              className="input resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs" style={{ color: "var(--ink-muted)" }}>
              {comment.length}/500
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button type="submit" disabled={isSubmitting || rating === 0} className="btn-primary">
              {isSubmitting ? "Submitting..." : "Submit review"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}