"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import { RoleBadge } from "@/components/shared/RoleBadge";
import type { Role } from "@/types/database";

type ReportItem = {
  id: string;
  post_id: string;
  reason: string;
  marked_fraudulent: boolean;
  created_at: string;
  post: {
    id: string;
    body: string | null;
    image_url: string | null;
    created_at: string;
  } | null;
  reporter: {
    id: string;
    username: string;
    role: Role;
  } | null;
  moderator: {
    id: string;
    username: string;
    role: Role;
  } | null;
};

export function AdminDashboard({ role }: { role: Role }) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const isAdmin = role === "admin";

  async function load() {
    const response = await fetch("/api/admin/reports");
    const json = await response.json();
    setReports(json.reports ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function mark(reportId: string, value: boolean) {
    const response = await fetch(`/api/admin/reports/${reportId}/fraudulent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    });
    if (response.ok) await load();
  }

  async function deletePost(postId: string) {
    const response = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    if (response.ok) await load();
  }

  async function updateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(formData.get("username") ?? ""),
        role: String(formData.get("role") ?? "user")
      })
    });
    const json = await response.json();
    setMessage(response.ok ? `@${json.user.username} devient ${json.user.role}` : json.error ?? "Erreur");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-3 py-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4">
        {reports.map((report) => (
          <article key={report.id} className="rounded-md border border-line bg-panel p-4 shadow-glow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black">Signalement</p>
                  {report.marked_fraudulent && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-1 text-xs font-bold text-danger">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      frauduleux
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  par @{report.reporter?.username ?? "inconnu"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => mark(report.id, !report.marked_fraudulent)}
                  className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-sky/60 hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {report.marked_fraudulent ? "Annuler" : "Frauduleux"}
                </button>
                {isAdmin && report.post && (
                  <button
                    type="button"
                    onClick={() => deletePost(report.post_id)}
                    className="focus-ring inline-flex items-center gap-2 rounded-md border border-danger/40 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            <p className="mt-3 rounded-md bg-ink p-3 text-sm text-zinc-200">{report.reason}</p>

            {report.post ? (
              <div className="mt-3 rounded-md border border-line bg-ink p-3">
                {report.post.body && <p className="whitespace-pre-wrap break-words text-sm">{report.post.body}</p>}
                {report.post.image_url && (
                  <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-md">
                    <Image src={report.post.image_url} alt="" fill className="object-cover" />
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-ink p-3 text-sm text-zinc-500">Post deja supprime.</p>
            )}
          </article>
        ))}

        {reports.length === 0 && (
          <div className="rounded-md border border-line bg-panel p-6 text-center text-sm text-zinc-400">
            Aucun signalement ouvert.
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="rounded-md border border-line bg-panel p-4">
          <div className="flex items-center gap-2">
            <p className="text-base font-black">Role actuel</p>
            <RoleBadge role={role} />
          </div>
          {isAdmin && (
            <form onSubmit={updateRole} className="mt-4 space-y-3">
              <input
                name="username"
                placeholder="pseudo"
                className="focus-ring w-full rounded-md border border-line bg-ink px-3 py-2 text-sm"
              />
              <select
                name="role"
                className="focus-ring w-full rounded-md border border-line bg-ink px-3 py-2 text-sm"
                defaultValue="moderator"
              >
                <option value="user">utilisateur</option>
                <option value="moderator">moderateur</option>
                <option value="admin">admin</option>
              </select>
              <button
                type="submit"
                className="focus-ring w-full rounded-md bg-admin px-4 py-2 text-sm font-black text-ink"
              >
                Appliquer
              </button>
              {message && <p className="text-sm font-semibold text-sky">{message}</p>}
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
