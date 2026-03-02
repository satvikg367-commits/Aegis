import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function ResourcesPage() {
  const { token } = useAuth();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");

  const load = async (category = "") => {
    try {
      const query = category ? `?category=${encodeURIComponent(category)}` : "";
      const data = await apiRequest(`/resources${query}`, { token });
      setResources(data.resources || []);
      setCategories(data.categories || []);
      setSelectedCategory(category);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  return (
    <>
      <section>
        <h1>Resource Center</h1>
        <p className="subtle">Guides, articles, and videos for financial planning, health, and career transition.</p>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <div className="inline-form spaced">
          <label>
            Filter by category
            <select value={selectedCategory} onChange={(e) => load(e.target.value)}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid cards-2">
        {resources.length ? resources.map((item) => (
          <article className="card" key={item.id}>
            <h2>{item.title}</h2>
            <p>
              <span className="badge">{item.category}</span> <span className="badge">{item.contentType}</span>
            </p>
            <p>{item.description}</p>
            {item.url && <a href={item.url} target="_blank" rel="noreferrer">Open Resource</a>}
          </article>
        )) : <p>No resources found for this category.</p>}
      </section>
    </>
  );
}
