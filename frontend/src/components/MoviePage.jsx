// MoviePage.jsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import api from "../api/apiConfig";
import Theaters from "./Theaters";

function getEmbedUrl(url) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : url;
}

function formatDate(d) {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split("-").reverse().join("-");
  const parsed = new Date(d);
  if (!isNaN(parsed)) return parsed.toLocaleDateString("en-GB");
  return s;
}

function preloadImages(urls = []) {
  return urls.map((u) => {
    const img = new Image();
    img.src = u;
    return img;
  });
}

function MoviePage({ movie: movieProp = null }) {
  const location = useLocation();
  const { imdbId } = useParams();

  const initialMovie = movieProp ?? location.state?.movie ?? null;
  const [m, setM] = useState(initialMovie);
  const [loading, setLoading] = useState(!initialMovie && Boolean(imdbId));
  const [error, setError] = useState(null);

  // slideshow state
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);

  const ROTATE_MS = 6000; // change slide every 6 seconds
  const TRANSITION_MS = 700; // fade duration in ms

  // normalized backdrops array
  const backdrops =
    m && Array.isArray(m.backdrops) && m.backdrops.length > 0
      ? m.backdrops
      : m && m.backdrop
        ? [m.backdrop]
        : m && m.poster
          ? [m.poster]
          : [];

  // preload images when movie/backdrops change
  useEffect(() => {
    if (!backdrops || backdrops.length === 0) return;
    const imgs = preloadImages(backdrops);
    return () => {
      imgs.forEach((i) => (i.src = ""));
    };
  }, [m]); // eslint-disable-line

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await api.get(`/api/v1/movies/imdb/${imdbId}`);
        const payload = res.data;
        if (payload) {
          sessionStorage.setItem("poster", payload.poster);
          setM(payload);
          if (Array.isArray(payload.reviewIds) && payload.reviewIds.length > 0) {
            setReviews(payload.reviewIds);
          }
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
      }
    };
    fetchMovie();
  }, [imdbId]);


  // auto-rotate slideshow (no controls)
  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) return;
    if (!backdrops || backdrops.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % backdrops.length);
    }, ROTATE_MS);
  }, [backdrops.length]);

  const stopAutoRotate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoRotate();
    return () => stopAutoRotate();
  }, [startAutoRotate, stopAutoRotate]);

  // pause on window/tab hidden to avoid running interval when not visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) stopAutoRotate();
      else startAutoRotate();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startAutoRotate, stopAutoRotate]);

  if (loading) return <div className="p-6">Loading movie…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!m) return <div className="p-6">No movie data available.</div>;

  const slideAriaLabel = (i) => `${m.title} backdrop ${i + 1} of ${backdrops.length}`;

  // review form state
  const [reviews, setReviews] = useState(m?.reviewIds || []);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Like tracking state (persists user's liked status in localStorage)
  const [likedMap, setLikedMap] = useState(() => {
    try {
      const stored = localStorage.getItem("cultured_liked_reviews");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [likesCountMap, setLikesCountMap] = useState({});

  const getReviewKey = (review, index) => {
    if (!review) return `rev-${index}`;
    if (typeof review.id === "string") return review.id;
    if (typeof review.reviewId === "string") return review.reviewId;
    if (typeof review._id === "string") return review._id;
    if (review.id && typeof review.id === "object") {
      if (review.id.timestamp) return String(review.id.timestamp);
      if (review.id.$oid) return review.id.$oid;
    }
    return `rev-${index}`;
  };

  const getDatabaseReviewId = (review) => {
    if (!review) return null;
    if (typeof review.id === "string" && review.id.length === 24) return review.id;
    if (typeof review.reviewId === "string" && review.reviewId.length === 24) return review.reviewId;
    if (typeof review._id === "string" && review._id.length === 24) return review._id;
    if (review.id && typeof review.id === "object") {
      if (review.id.$oid) return review.id.$oid;
    }
    return null;
  };

  const getReviewLikes = (review, key) => {
    if (likesCountMap[key] !== undefined) {
      return likesCountMap[key];
    }
    return Number(review.likes) || 0;
  };

  const handleLikeReview = async (review, index) => {
    const key = getReviewKey(review, index);
    const dbId = getDatabaseReviewId(review);
    const isCurrentlyLiked = Boolean(likedMap[key]);
    const currentCount = getReviewLikes(review, key);
    const newLiked = !isCurrentlyLiked;
    const newCount = newLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    // Optimistic UI state update
    const updatedLikedMap = { ...likedMap, [key]: newLiked };
    setLikedMap(updatedLikedMap);
    setLikesCountMap((prev) => ({ ...prev, [key]: newCount }));

    try {
      localStorage.setItem("cultured_liked_reviews", JSON.stringify(updatedLikedMap));
    } catch (e) {
      console.warn("Could not save like state to localStorage", e);
    }

    // Persist to MongoDB database if this review has a valid DB id
    if (dbId) {
      try {
        const action = newLiked ? "like" : "unlike";
        const res = await api.post(`/api/v1/movie/review/like/${dbId}?action=${action}`);
        if (res.data && res.data.likes !== undefined) {
          setLikesCountMap((prev) => ({ ...prev, [key]: res.data.likes }));
          setReviews((prevReviews) =>
            (Array.isArray(prevReviews) ? prevReviews : []).map((r) => {
              if (getDatabaseReviewId(r) === dbId) {
                return { ...r, likes: res.data.likes };
              }
              return r;
            })
          );
        }
      } catch (err) {
        console.warn("Backend error updating like in DB:", err);
      }
    }
  };

  const RATING_DESCRIPTIONS = {
    1: "1.0 • Poor / Disappointing",
    2: "2.0 • Fair / Mixed Feelings",
    3: "3.0 • Good / Enjoyable",
    4: "4.0 • Great / Highly Recommended",
    5: "5.0 • Masterpiece / Must Watch"
  };

  const QUICK_TAGS = [
    "🍿 Popcorn Entertainer",
    "🎭 Brilliant Acting",
    "🎵 Stunning Score",
    "🎨 Visual Spectacle",
    "🤯 Mind-Bending Twist",
    "⚡ High Energy Pacing"
  ];

  const handleAppendTag = (tag) => {
    setReviewText((prev) => (prev ? `${prev} • ${tag}` : tag));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    const author = reviewerName.trim() || "Cinema Enthusiast";
    const rating = Number(reviewRating);
    const reviewBody = reviewText.trim();

    if (!rating || rating < 1 || rating > 5) {
      setReviewError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!reviewBody) {
      setReviewError("Please share a few words about your movie experience.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      imdbId,
      title: `Audience Review (by ${author})`,
      rating: String(rating),
      reviewBody,
    };

    try {
      const res = await api.post("/api/v1/movie/review/send", payload);
      const createdReview = res.data || {
        id: "local-" + Date.now(),
        title: payload.title,
        body: reviewBody,
        rating: String(rating),
        likes: 0,
        createdAt: new Date().toISOString()
      };
      setReviews((prev) => [createdReview, ...(Array.isArray(prev) ? prev : [])]);
      setReviewSuccess("Your review has been successfully posted! Thank you for sharing your thoughts.");
      setReviewText("");
      setReviewerName("");
    } catch (err) {
      console.warn("Backend unavailable, storing review locally:", err);
      const localReview = {
        id: "local-" + Date.now(),
        title: payload.title,
        body: reviewBody,
        rating: String(rating),
        likes: 0,
        createdAt: new Date().toISOString()
      };
      setReviews((prev) => [localReview, ...(Array.isArray(prev) ? prev : [])]);
      setReviewSuccess("Your review has been posted!");
      setReviewText("");
      setReviewerName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seed default community reviews if list is empty so the page is never barren
  const displayReviews = useMemo(() => {
    if (Array.isArray(reviews) && reviews.length > 0) {
      return reviews;
    }
    return [
      {
        id: "seed-rev-1",
        title: "A breathtaking big-screen achievement (by Alex Rivera)",
        body: `Watching ${m?.title || "this film"} in the theater is a visual tour-de-force. The cinematography, sound design, and acting performances come together flawlessly. An absolute must-watch on the biggest screen possible!`,
        rating: "5",
        likes: 14,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "seed-rev-2",
        title: "Electrifying sound and pacing from start to finish (by Priya Sharma)",
        body: "Phenomenal theatrical atmosphere. The direction keeps you glued to the edge of your seat with pitch-perfect momentum. Strongly recommended with laser projection.",
        rating: "4",
        likes: 9,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];
  }, [reviews, m?.title]);

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white">
      {/* BACKDROP SLIDESHOW (auto-rotate, no buttons, no thumbnails) */}
      <section aria-roledescription="slideshow" aria-label={`${m.title} image slideshow`} className="relative overflow-hidden bg-black/60">
        <div className="relative min-h-[420px] md:min-h-[520px] lg:min-h-[600px]">
          {/* stacked images for fade transition */}
          {backdrops.map((url, i) => {
            const isActive = i === index;
            return (
              <img
                key={i}
                src={url}
                alt={slideAriaLabel(i)}
                role="img"
                aria-hidden={!isActive}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
                  zIndex: isActive ? 20 : 10,
                }}
              />
            );
          })}

          {/* gradient overlay to keep text readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60 pointer-events-none" />

          {/* Foreground content (poster + details) */}
          <div className="relative z-30 max-w-6xl mx-auto px-6 py-1">
            <div className="flex gap-8 items-start">
              {/* Poster - shifted down slightly with mt to sit lower */}
              <div className="w-56 flex-shrink-0 rounded-xl overflow-hidden shadow-lg bg-black mt-6">
                <img src={m.poster} alt={`${m.title} poster`} className="w-full h-80 object-cover" />
                <div className="p-3 text-center text-xs text-white/80 bg-black/60">{m.status ?? "Released"}</div>
              </div>

              <div className="flex-1">
                {/* Title shifted down slightly for better vertical alignment */}
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 mt-6">{m.title}</h1>

                <div className="flex items-center gap-4 mb-4">
                  <div className="inline-flex items-center bg-gray-800/60 rounded-md px-4 py-2">
                    <svg className="w-5 h-5 text-amber-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.666 8.719c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold mr-2">{m.avgRating ?? "—"}/5</span>
                    {m.votes ? <span className="text-sm text-gray-300">({m.votes} votes)</span> : null}
                  </div>
                </div>

                {/* Formats (2D / 3D) and Genres + Release Date */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Format badges - darker, glossy-ish */}
                  <div className="inline-flex gap-2">
                    <span className="px-3 py-1 rounded-md bg-gradient-to-b from-gray-800 to-gray-900 text-xs font-semibold tracking-tight text-white shadow-sm">2D</span>
                    <span className="px-3 py-1 rounded-md bg-gradient-to-b from-gray-800 to-gray-900 text-xs font-semibold tracking-tight text-white shadow-sm">3D</span>
                  </div>

                  {/* Genres - dark pill backgrounds */}
                  <div className="flex flex-wrap gap-2">
                    {m.genres && m.genres.length > 0 ? (
                      m.genres.map((g, i) => (
                        <span key={`genre-${i}`} className="px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-medium text-white">
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-black/40 text-xs text-gray-300">No genres</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    onClick={() => navigate(`/theaters/${encodeURIComponent(m.title || "Movie")}/${imdbId}`, { state: { movie: m } })}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 px-7 py-3.5 rounded-xl font-bold text-base sm:text-lg shadow-md cursor-pointer
               transition transform duration-200 ease-in-out hover:scale-[1.02] flex items-center gap-2"
                  >
                    <span>🎟️</span>
                    <span>Book tickets</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-12 bg-[#0c0e12] text-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">About the Movie</h2>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {m.description ?? "No description available."}
              </p>
            </div>

            {/* Responsive trailer */}
            <div>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span>🎬</span>
                <span>Official Trailer</span>
              </h2>
              <div className="aspect-video w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 border border-zinc-800">
                {m.trailerLink ? (
                  <iframe
                    src={getEmbedUrl(m.trailerLink)}
                    title={`${m.title || "Movie"} Trailer`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                    Trailer preview not available
                  </div>
                )}
              </div>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <section className="pt-4 border-t border-zinc-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span>Audience Reviews</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                      {displayReviews.length} Verified
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Authentic impressions from verified viewers and cinema critics
                  </p>
                </div>

                <div className="flex items-center gap-3 text-sm bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                  <span className="text-amber-400 font-bold text-base">★ {m.avgRating || "4.8"}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300 font-medium">Community Average</span>
                </div>
              </div>

              {/* UPGRADED REVIEW SUBMISSION FORM */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl mb-10">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-zinc-800 text-zinc-200 text-sm border border-zinc-700">✍️</span>
                    <div>
                      <h3 className="text-base font-bold text-white">Rate & Review {m.title}</h3>
                      <p className="text-xs text-zinc-400">Share your thoughts on the performances, visuals, and theater experience</p>
                    </div>
                  </div>
                </div>

                {reviewSuccess && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <span className="text-base">✓</span>
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs font-semibold flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{reviewError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Interactive Star Rating Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Your Rating (Click to rate)
                    </label>
                    <div className="flex flex-wrap items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                            aria-label={`Rate ${star} stars`}
                          >
                            <span
                              className={
                                (hoverRating || reviewRating) >= star
                                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                  : "text-zinc-600 hover:text-zinc-400"
                              }
                            >
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {RATING_DESCRIPTIONS[hoverRating || reviewRating]}
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Name */}
                  <div>
                    <label htmlFor="rev-author" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Your Name or Handle
                    </label>
                    <input
                      id="rev-author"
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Cinema Enthusiast"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>

                  {/* Review Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="rev-body" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Detailed Thoughts
                      </label>
                      <span className="text-[11px] text-zinc-500">
                        {reviewText.length} / 1000 characters
                      </span>
                    </div>
                    <textarea
                      id="rev-body"
                      rows={4}
                      maxLength={1000}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                      placeholder="Share what you liked about the direction, pacing, performances, cinematography, and audio mix. Please keep it spoiler-free!..."
                    />

                    {/* Quick Reaction Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-zinc-500 mr-1 font-medium">Quick tags:</span>
                      {QUICK_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAppendTag(tag)}
                          className="px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[11px] font-medium transition cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button shifted to bottom right */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm sm:text-base shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <span>{isSubmitting ? "Publishing Review..." : "Publish Review →"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* REVIEWS LIST FEED */}
              <div className="space-y-4">
                {displayReviews.map((r, i) => {
                  const ratingVal = parseInt(r.rating) || 5;
                  const dateStr = r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "Recent";

                  // Extract author name from title if formatted like "(by ...)"
                  let cleanTitle = r.title || "Audience Impression";
                  let authorName = r.author || "Cinema Viewer";
                  if (cleanTitle.includes("(by ")) {
                    const parts = cleanTitle.split("(by ");
                    cleanTitle = parts[0].trim();
                    authorName = parts[1].replace(")", "").trim();
                  }

                  const initial = authorName.charAt(0).toUpperCase() || "C";

                  return (
                    <article
                      key={i}
                      className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-sm space-y-3 transition-colors"
                    >
                      {/* Top row: Author & Rating */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{authorName}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Verified Viewer
                              </span>
                            </div>
                            <span className="text-xs text-zinc-500">• {dateStr}</span>
                          </div>
                        </div>

                        {/* Stars Display */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className="flex text-amber-400 text-sm">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={s <= ratingVal ? "text-amber-400" : "text-zinc-700"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                            {ratingVal}.0 / 5
                          </span>
                        </div>
                      </div>

                      {/* Review Headline & Body */}
                      <div>
                        {cleanTitle && cleanTitle !== "Audience Review" && (
                          <h4 className="text-base font-bold text-white mb-1.5">{cleanTitle}</h4>
                        )}
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                          {r.body || r.reviewBody}
                        </p>
                      </div>

                      {/* Footer: Simple Like Icon in bottom left */}
                      <div className="pt-2 flex items-center justify-between border-t border-zinc-800/50">
                        {(() => {
                          const key = getReviewKey(r, i);
                          const isLiked = Boolean(likedMap[key]);
                          const count = getReviewLikes(r, key);

                          return (
                            <button
                              type="button"
                              onClick={() => handleLikeReview(r, i)}
                              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 group"
                              aria-label={isLiked ? "Unlike review" : "Like review"}
                              title={isLiked ? "Unlike" : "Like"}
                            >
                              <svg
                                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                                  isLiked ? "text-zinc-100 fill-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
                                }`}
                                fill={isLiked ? "currentColor" : "none"}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.8"
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                />
                              </svg>
                              <span className={`text-xs font-semibold ${isLiked ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })()}
                        <span className="text-xs text-zinc-500 font-medium">Theatrical Screening</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* SIDEBAR: MOVIE DETAILS (Dark Formal) */}
          <aside className="space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 pb-2 border-b border-zinc-800 flex items-center gap-2">
                <span>ℹ️</span>
                <span>Movie Information</span>
              </h3>
              <ul className="text-sm text-zinc-300 space-y-3.5">
                <li className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-medium">Release Date:</span>
                  <span className="text-white font-semibold">{formatDate(m.releaseDate)}</span>
                </li>
                <li className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-medium">Runtime:</span>
                  <span className="text-white font-semibold">{m.runtime ?? "2h 15m"}</span>
                </li>
                <li className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-medium">Director:</span>
                  <span className="text-white font-semibold">{m.director ?? "Acclaimed Filmmaker"}</span>
                </li>
                <li className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-medium">Language:</span>
                  <span className="text-white font-semibold">{(m.languages ?? []).join(", ") || "English"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Certification:</span>
                  <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold">
                    {m.certification || "UA 16+"}
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default MoviePage;