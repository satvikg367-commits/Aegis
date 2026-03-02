import { Router } from "express";
import { addNotification, getDb, nextId, updateDb } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function enrichPost(db, post) {
  const author = db.users.find((u) => u.id === post.userId) || null;
  const replies = db.forumReplies
    .filter((r) => r.postId === post.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((reply) => ({
      ...reply,
      user: db.users.find((u) => u.id === reply.userId) || null
    }));

  return { ...post, user: author, replies };
}

router.get("/posts", requireAuth, (req, res) => {
  const db = getDb();
  const posts = db.forumPosts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => enrichPost(db, post));

  return res.status(200).json({ posts });
});

router.post("/posts", requireAuth, (req, res) => {
  const { title = "", content = "", category = "General" } = req.body || {};
  if (!title.trim() || !content.trim()) {
    return res.status(400).json({ error: "title and content are required" });
  }

  const userId = req.auth.userId;
  let created = null;
  updateDb((db) => {
    const id = nextId(db, "forumPosts");
    created = {
      id,
      userId,
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || "General",
      isFlagged: false,
      isLocked: false,
      createdAt: new Date().toISOString()
    };
    db.forumPosts.push(created);
    return db;
  });

  const db = getDb();
  return res.status(201).json({ message: "Post created", post: enrichPost(db, created) });
});

router.post("/replies", requireAuth, (req, res) => {
  const { postId, content = "" } = req.body || {};
  if (!postId || !content.trim()) {
    return res.status(400).json({ error: "postId and content are required" });
  }

  const db = getDb();
  const post = db.forumPosts.find((p) => p.id === Number(postId));
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  if (post.isLocked) {
    return res.status(400).json({ error: "Post is locked" });
  }

  const userId = req.auth.userId;
  let reply = null;
  updateDb((draft) => {
    const id = nextId(draft, "forumReplies");
    reply = {
      id,
      postId: post.id,
      userId,
      content: content.trim(),
      isFlagged: false,
      createdAt: new Date().toISOString()
    };
    draft.forumReplies.push(reply);
    addNotification(draft, post.userId, "Community", "New forum reply", `A reply was posted on '${post.title}'.`);
    return draft;
  });

  const freshDb = getDb();
  return res.status(201).json({ message: "Reply added", reply: { ...reply, user: freshDb.users.find((u) => u.id === userId) } });
});

router.post("/report", requireAuth, (req, res) => {
  const { postId } = req.body || {};
  if (!postId) {
    return res.status(400).json({ error: "postId is required" });
  }

  updateDb((db) => {
    const post = db.forumPosts.find((p) => p.id === Number(postId));
    if (post) {
      post.isFlagged = true;
    }
    return db;
  });

  return res.status(200).json({ message: "Post reported for moderation" });
});

export default router;
