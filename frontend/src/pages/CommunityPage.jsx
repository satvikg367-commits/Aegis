import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const initialPost = { category: "General", title: "", content: "" };

export default function CommunityPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState(initialPost);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiRequest("/community/posts", { token });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const createPost = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/community/posts", {
        method: "POST",
        token,
        body: postForm
      });
      setPostForm(initialPost);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const createReply = async (postId) => {
    const content = (replyDrafts[postId] || "").trim();
    if (!content) return;

    setError("");
    try {
      await apiRequest("/community/replies", {
        method: "POST",
        token,
        body: { postId, content }
      });
      setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const reportPost = async (postId) => {
    setError("");
    try {
      await apiRequest("/community/report", { method: "POST", token, body: { postId } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section>
        <h1>Community Forum</h1>
        <p className="subtle">Discuss pension, healthcare, careers, legal matters, and retirement life.</p>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <h2>Start a Discussion</h2>
        <form className="form-grid" onSubmit={createPost}>
          <label>
            Category
            <select value={postForm.category} onChange={(e) => setPostForm((p) => ({ ...p, category: e.target.value }))}>
              <option>Pension</option>
              <option>Healthcare</option>
              <option>Career</option>
              <option>Legal</option>
              <option>Wellbeing</option>
              <option>General</option>
            </select>
          </label>
          <label>
            Title
            <input value={postForm.title} onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))} required />
          </label>
          <label>
            Message
            <textarea rows={4} value={postForm.content} onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))} required />
          </label>
          <button type="submit">Publish Discussion Post</button>
        </form>
      </section>

      <section>
        <h2>Discussions</h2>
        {posts.length ? posts.map((post) => (
          <article key={post.id} className="card forum-post">
            <header className="forum-post-header">
              <div>
                <h3>{post.title}</h3>
                <p className="subtle">
                  {post.category} | by {post.user?.fullName || "Member"} on {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                {post.isFlagged && <span className="badge danger">Flagged</span>}
                <button type="button" className="ghost-btn" onClick={() => reportPost(post.id)}>Report to Moderator</button>
              </div>
            </header>

            <p>{post.content}</p>

            <div className="reply-block">
              <h4>Replies</h4>
              <ul className="list compact">
                {post.replies.length ? post.replies.map((reply) => (
                  <li key={reply.id}>
                    <strong>{reply.user?.fullName || "Member"}</strong>: {reply.content}
                    <div className="subtle">{new Date(reply.createdAt).toLocaleString()}</div>
                  </li>
                )) : <li>No replies yet.</li>}
              </ul>
              <div className="inline-reply-form">
                <textarea
                  rows={2}
                  placeholder="Write a reply"
                  value={replyDrafts[post.id] || ""}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                />
                <button type="button" onClick={() => createReply(post.id)}>Submit Reply</button>
              </div>
            </div>
          </article>
        )) : <p>No discussions yet.</p>}
      </section>
    </>
  );
}
