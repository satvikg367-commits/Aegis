import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const initialRequest = { requestType: "Bank Account Update", details: "" };
const initialExpense = { category: "Groceries", amount: "", expenseDate: "", note: "" };

export default function PensionPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [requestForm, setRequestForm] = useState(initialRequest);
  const [expenseForm, setExpenseForm] = useState(initialExpense);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const payload = await apiRequest("/pension", { token });
      setData(payload);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const submitRequest = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/pension/requests", { method: "POST", token, body: requestForm });
      setRequestForm(initialRequest);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiRequest("/pension/expenses", { method: "POST", token, body: expenseForm });
      setExpenseForm(initialExpense);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading pension data...</div>;

  return (
    <>
      <section>
        <h1>Pension Management</h1>
        <p className="subtle">Track pension credits, raise service requests, and manage expenses.</p>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Profile</h2>
          {data.profile ? (
            <>
              <p><strong>Pension ID:</strong> {data.profile.pensionId}</p>
              <p><strong>Current Pension:</strong> INR {Number(data.profile.currentAmount).toFixed(2)}</p>
              <p><strong>Bank Account:</strong> XXXX{data.profile.bankAccountLast4}</p>
              <p><strong>Upcoming Payment:</strong> {new Date(data.profile.nextPaymentDate).toLocaleDateString()}</p>
            </>
          ) : (
            <p>No profile linked.</p>
          )}
        </article>

        <article className="card">
          <h2>Raise Pension Request</h2>
          <form className="form-grid" onSubmit={submitRequest}>
            <label>
              Request Type
              <select
                value={requestForm.requestType}
                onChange={(e) => setRequestForm((p) => ({ ...p, requestType: e.target.value }))}
              >
                <option>Bank Account Update</option>
                <option>Address Change</option>
                <option>Nominee Correction</option>
                <option>Life Certificate Issue</option>
                <option>Arrears/Discrepancy</option>
              </select>
            </label>
            <label>
              Details
              <textarea
                rows={4}
                value={requestForm.details}
                onChange={(e) => setRequestForm((p) => ({ ...p, details: e.target.value }))}
                required
              />
            </label>
            <button type="submit">Submit Request</button>
          </form>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Pension Money Management (This Month)</h2>
          <p><strong>Monthly Budget:</strong> INR {Number(data.monthlyPensionBudget).toFixed(2)}</p>
          <p><strong>Payments This Month:</strong> INR {Number(data.monthlyPaymentTotal).toFixed(2)}</p>
          <p><strong>Expenses This Month:</strong> INR {Number(data.monthlyExpenseTotal).toFixed(2)}</p>
          <p>
            <strong>Remaining:</strong>{" "}
            <span className={`badge ${data.remainingBalance >= 0 ? "success" : "danger"}`}>
              INR {Number(data.remainingBalance).toFixed(2)}
            </span>
          </p>
        </article>

        <article className="card">
          <h2>Add Expense</h2>
          <form className="form-grid" onSubmit={submitExpense}>
            <label>
              Category
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option>Groceries</option>
                <option>Healthcare</option>
                <option>Utilities</option>
                <option>Travel</option>
                <option>Family</option>
                <option>Miscellaneous</option>
              </select>
            </label>
            <label>
              Amount (INR)
              <input
                type="number"
                step="0.01"
                min="1"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                required
              />
            </label>
            <label>
              Date & Time
              <input
                type="datetime-local"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm((p) => ({ ...p, expenseDate: e.target.value }))}
              />
            </label>
            <label>
              Note
              <textarea
                rows={3}
                value={expenseForm.note}
                onChange={(e) => setExpenseForm((p) => ({ ...p, note: e.target.value }))}
              />
            </label>
            <button type="submit">Add Expense</button>
          </form>
        </article>
      </section>

      <section className="card">
        <h2>Expense History</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.length ? data.expenses.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.expenseDate).toLocaleString()}</td>
                  <td>{e.category}</td>
                  <td>INR {Number(e.amount).toFixed(2)}</td>
                  <td>{e.note || "-"}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}>No expenses added.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Payment History</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length ? data.payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td>INR {Number(p.amount).toFixed(2)}</td>
                  <td><span className="badge success">{p.status}</span></td>
                  <td>{p.note}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}>No payment history.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Request Tracking</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.length ? data.requests.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.requestType}</td>
                  <td><span className="badge warning">{r.status}</span></td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{r.details}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}>No pension requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
