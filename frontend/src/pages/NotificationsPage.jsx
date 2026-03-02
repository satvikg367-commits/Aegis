import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiRequest("/notifications", { token });
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const markRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "POST", token });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "POST", token });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section>
        <h1>Notifications & Alerts</h1>
        <p className="subtle">Important updates from pension, healthcare, career, and community sections.</p>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <button type="button" onClick={markAllRead}>Mark All as Read</button>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Title</th>
                <th>Message</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length ? notifications.map((n) => (
                <tr key={n.id}>
                  <td>{n.category}</td>
                  <td>{n.title}</td>
                  <td>{n.message}</td>
                  <td>{new Date(n.createdAt).toLocaleString()}</td>
                  <td>
                    {n.isRead ? <span className="badge">Read</span> : <span className="badge warning">Unread</span>}
                  </td>
                  <td>
                    {!n.isRead ? <button type="button" onClick={() => markRead(n.id)}>Mark Read</button> : "-"}
                  </td>
                </tr>
              )) : <tr><td colSpan={6}>No notifications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
