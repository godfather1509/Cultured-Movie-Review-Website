// MoviePage.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import api from "../api/apiConfig";

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
        console.log(payload);
        setM(payload)
      } catch (err) {
        console.error(err);
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
  const [reviews, setReviews] = useState(m.reviewIds);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    const title = reviewTitle.trim() || "Anonymous";
    const rating = Number(reviewRating);
    const reviewBody = reviewText.trim();

    if (!rating || rating < 1 || rating > 5) {
      setReviewError("Please provide a rating between 1 and 5.");
      return;
    }
    if (!reviewBody) {
      setReviewError("Please write a short review.");
      return;
    }

    const newReview = {
      imdbId,
      title,
      rating,
      reviewBody,
    };

    console.log(newReview)
    try {
      const res = await api.post("/api/v1/movie/review/send", newReview);
      if (res.status === 200 || res.status === 201) {
        // Add the new review to the existing reviews array
        setReviews(prevReviews => [...prevReviews, newReview]);
        // // Optionally, clear the form fields
        // setReviewTitle("");
        // setReviewRating("");
        // setReviewText("");
        window.location.reload()
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
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
                    <svg className="w-5 h-5 text-pink-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                <div className="flex gap-6 items-center">
                  <button className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold shadow">Book tickets</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-12 bg-white dark:bg-black">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line mb-6">{m.description ?? "No description available."}</p>

            {/* responsive trailer */}
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
              <ReactPlayer url={m.trailerLink} controls pip width="100%" height="100%" />
            </div>

            {/* --- Reviews section --- */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Reviews</h2>
                <div className="text-sm text-gray-600">
                  {m.avgRating ? (
                    <>
                      <span className="font-semibold">{m.avgRating}</span> <span className="text-gray-500">avg</span> • <span className="text-gray-500">{reviews.length} reviews</span>
                    </>
                  ) : (
                    <span className="text-gray-500">No reviews yet</span>
                  )}
                </div>
              </div>

              {/* review form */}
              <form onSubmit={handleSubmitReview} className="bg-gray-900 rounded-lg p-4 shadow-sm mb-6">
                {reviewError && <div className="text-sm text-red-600 mb-2">{reviewError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-10 mb-3">
                  <div>
                    <label htmlFor="rev-name" className="block text-sm font-medium text-white">Title</label>
                    <input
                      id="rev-name"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="mt-1 bg-gray-50 block w-full border-gray-300 rounded-md text-black shadow-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="rev-rating" className="block text-sm font-medium text-white">Rating (1–5)</label>
                    <input
                      id="rev-rating"
                      type="number"
                      min="1"
                      max="5"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      className="mt-1 block bg-gray-50 w-full text-black border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <textarea id="rev-text" rows={2} value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="mt-1 block w-full border-gray-300 bg-gray-10 text-white rounded-md shadow-sm" placeholder="Tell others what you thought..." />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className="cursor-pointer bg-pink-600 text-white px-4 py-2 rounded-md font-semibold">Submit Review</button>
                </div>
              </form>

              {/* review list */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-gray-500">Be the first to review this movie.</div>
                ) : (
                  reviews.map((r, i) => (
                    <article key={i} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-black font-semibold">{r.title}</div>
                            <div className="text-xs text-black">• {new Date(r.createdAt).toLocaleDateString('en-GB')}</div>
                          </div>
                          <div className="mt-2 text-sm text-black">{r.body}</div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="bg-black px-3 py-1 rounded-full text-sm font-semibold">{r.rating}</div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <ul className="mt-2 text-sm text-gray-900 space-y-1">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span><strong>Release Date:</strong> {formatDate(m.releaseDate)}</span>
                </li>
                <li><strong>Runtime:</strong> {m.runtime ?? "—"}</li>
                <li><strong>Director:</strong> {m.director ?? "—"}</li>
                <li><strong>Language:</strong> {(m.languages ?? []).join(", ") || "—"}</li>
                <li className="text-sm text-black/90"><span>
                  <strong>Certification:</strong>
                  {m.certification ? m.certification + " • " : " —"}</span>
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