// Ce client imite l'interface de Supabase mais utilise vos API Routes
class SupabaseClientProxy {
  from(table: string) {
    return {
      select: async (columns = "*") => {
        const response = await fetch(
          `/api/supabase?table=${table}&columns=${columns}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          return {
            data: null,
            error: new Error(error.error || "Erreur réseau"),
          };
        }

        const data = await response.json();
        return { data, error: null };
      },

      insert: async (data: any) => {
        const response = await fetch("/api/supabase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ table, data }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            data: null,
            error: new Error(error.error || "Erreur réseau"),
          };
        }

        const result = await response.json();
        return { data: result, error: null };
      },

      update: async (data: any) => {
        return {
          eq: async (column: string, value: any) => {
            const response = await fetch("/api/supabase", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                table,
                data,
                matchColumn: column,
                matchValue: value,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              return {
                data: null,
                error: new Error(error.error || "Erreur réseau"),
              };
            }

            const result = await response.json();
            return { data: result, error: null };
          },
        };
      },

      delete: async () => {
        return {
          eq: async (column: string, value: any) => {
            const response = await fetch(
              `/api/supabase?table=${table}&matchColumn=${column}&matchValue=${value}`,
              { method: "DELETE" }
            );

            if (!response.ok) {
              const error = await response.json();
              return {
                data: null,
                error: new Error(error.error || "Erreur réseau"),
              };
            }

            const result = await response.json();
            return { data: result, error: null };
          },
        };
      },

      // Pour les requêtes avec conditions
      eq: async (column: string, value: any) => {
        const response = await fetch(
          `/api/supabase?table=${table}&matchColumn=${column}&matchValue=${value}`,
          { method: "GET" }
        );

        if (!response.ok) {
          const error = await response.json();
          return {
            data: null,
            error: new Error(error.error || "Erreur réseau"),
          };
        }

        const data = await response.json();
        return { data, error: null };
      },

      single: async () => {
        const response = await fetch(`/api/supabase?table=${table}`, {
          method: "GET",
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            data: null,
            error: new Error(error.error || "Erreur réseau"),
          };
        }

        const data = await response.json();
        return { data: data[0] || null, error: null };
      },

      order: async (column: string, { ascending = true } = {}) => {
        const response = await fetch(
          `/api/supabase?table=${table}&orderColumn=${column}&orderAscending=${ascending}`,
          { method: "GET" }
        );

        if (!response.ok) {
          const error = await response.json();
          return {
            data: null,
            error: new Error(error.error || "Erreur réseau"),
          };
        }

        const data = await response.json();
        return { data, error: null };
      },
    };
  }

  // Autres méthodes de Supabase si nécessaire
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);
        formData.append("bucket", bucket);

        const response = await fetch("/api/storage", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            data: null,
            error: new Error(error.error || "Erreur upload"),
          };
        }

        const data = await response.json();
        return { data, error: null };
      },
      getPublicUrl: (path: string) => {
        return {
          data: { publicUrl: `/api/storage/${path}` },
        };
      },
    }),
  };
}

export const supabase = new SupabaseClientProxy();
