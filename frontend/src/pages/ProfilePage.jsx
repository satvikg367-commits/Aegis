import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const [accessForm, setAccessForm] = useState({ highContrast: false, textToSpeech: false, fontScale: 100 });
  const [notifyForm, setNotifyForm] = useState({ pension: true, healthcare: true, career: true, community: true });
  const [twofaSecret, setTwofaSecret] = useState("");
  const [twofaUri, setTwofaUri] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setProfileForm({ fullName: user.fullName || "", phone: user.phone || "" });
    setAccessForm({
      highContrast: Boolean(user.accessibility?.highContrast),
      textToSpeech: Boolean(user.accessibility?.textToSpeech),
      fontScale: Number(user.accessibility?.fontScale || 100)
    });
    setNotifyForm({
      pension: Boolean(user.notificationPrefs?.pension),
      healthcare: Boolean(user.notificationPrefs?.healthcare),
      career: Boolean(user.notificationPrefs?.career),
      community: Boolean(user.notificationPrefs?.community)
    });
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/profile", { method: "PUT", token, body: profileForm });
      await refreshUser();
      setMessage("Profile updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const saveAccessibility = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/profile/accessibility", { method: "PUT", token, body: accessForm });
      await refreshUser();
      setMessage("Accessibility settings updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const saveNotifications = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/profile/notifications", { method: "PUT", token, body: notifyForm });
      await refreshUser();
      setMessage("Notification preferences updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const setup2fa = async () => {
    setError("");
    setMessage("");
    try {
      const data = await apiRequest("/auth/2fa/setup", { method: "POST", token });
      setTwofaSecret(data.secret || "");
      setTwofaUri(data.otpauthUrl || "");
      setMessage("2FA setup secret generated. Verify to enable.");
    } catch (err) {
      setError(err.message);
    }
  };

  const enable2fa = async () => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/auth/2fa/enable", { method: "POST", token, body: { code: twofaCode } });
      setTwofaCode("");
      setTwofaSecret("");
      setTwofaUri("");
      await refreshUser();
      setMessage("2FA enabled");
    } catch (err) {
      setError(err.message);
    }
  };

  const disable2fa = async () => {
    setError("");
    setMessage("");
    try {
      await apiRequest("/auth/2fa/disable", { method: "POST", token });
      setTwofaCode("");
      setTwofaSecret("");
      setTwofaUri("");
      await refreshUser();
      setMessage("2FA disabled");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section>
        <h1>Profile & Security</h1>
        <p className="subtle">Manage account details, accessibility preferences, alerts, and two-factor authentication.</p>
      </section>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="grid cards-2">
        <article className="card">
          <h2>Personal Information</h2>
          <form className="form-grid" onSubmit={saveProfile}>
            <label>
              Full Name
              <input value={profileForm.fullName} onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))} required />
            </label>
            <label>
              Email
              <input value={user?.email || ""} disabled />
            </label>
            <label>
              Mobile Number
              <input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
            </label>
            <button type="submit">Save Profile</button>
          </form>
        </article>

        <article className="card">
          <h2>Two-Factor Authentication</h2>
          {user?.twofaEnabled ? (
            <>
              <p className="alert success">2FA is enabled for your account.</p>
              <button type="button" onClick={disable2fa}>Disable 2FA</button>
            </>
          ) : (
            <>
              <button type="button" onClick={setup2fa}>Generate 2FA Secret</button>
              {twofaSecret && (
                <div className="alert warning">
                  <p><strong>Secret:</strong> <code>{twofaSecret}</code></p>
                  <p>Authenticator URI:</p>
                  <code className="break-all">{twofaUri}</code>
                  <label>
                    Enter 6-digit code
                    <input value={twofaCode} onChange={(e) => setTwofaCode(e.target.value)} maxLength={6} />
                  </label>
                  <button type="button" onClick={enable2fa}>Enable 2FA</button>
                </div>
              )}
            </>
          )}
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Accessibility</h2>
          <form className="form-grid" onSubmit={saveAccessibility}>
            <label className="inline-field">
              <input
                type="checkbox"
                checked={accessForm.highContrast}
                onChange={(e) => setAccessForm((p) => ({ ...p, highContrast: e.target.checked }))}
              />
              High contrast mode
            </label>
            <label className="inline-field">
              <input
                type="checkbox"
                checked={accessForm.textToSpeech}
                onChange={(e) => setAccessForm((p) => ({ ...p, textToSpeech: e.target.checked }))}
              />
              Enable text-to-speech control
            </label>
            <label>
              Font Size (%)
              <input
                type="range"
                min={90}
                max={130}
                step={5}
                value={accessForm.fontScale}
                onChange={(e) => setAccessForm((p) => ({ ...p, fontScale: Number(e.target.value) }))}
              />
            </label>
            <button type="submit">Save Accessibility</button>
          </form>
        </article>

        <article className="card">
          <h2>Notification Preferences</h2>
          <form className="form-grid" onSubmit={saveNotifications}>
            <label className="inline-field">
              <input type="checkbox" checked={notifyForm.pension} onChange={(e) => setNotifyForm((p) => ({ ...p, pension: e.target.checked }))} />
              Pension updates
            </label>
            <label className="inline-field">
              <input type="checkbox" checked={notifyForm.healthcare} onChange={(e) => setNotifyForm((p) => ({ ...p, healthcare: e.target.checked }))} />
              Healthcare alerts
            </label>
            <label className="inline-field">
              <input type="checkbox" checked={notifyForm.career} onChange={(e) => setNotifyForm((p) => ({ ...p, career: e.target.checked }))} />
              Career opportunities
            </label>
            <label className="inline-field">
              <input type="checkbox" checked={notifyForm.community} onChange={(e) => setNotifyForm((p) => ({ ...p, community: e.target.checked }))} />
              Community updates
            </label>
            <button type="submit">Save Preferences</button>
          </form>
        </article>
      </section>

      <section className="card">
        <h2>Data Security & Privacy</h2>
        <ul className="list compact">
          <li>Passwords are hashed before storage.</li>
          <li>2FA is available for stronger account security.</li>
          <li>Critical pension, healthcare, and account actions generate notification trails.</li>
          <li>Only authenticated users can access protected services.</li>
        </ul>
      </section>
    </>
  );
}
