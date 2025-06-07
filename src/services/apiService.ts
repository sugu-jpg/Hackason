// services/apiService.ts

export class ApiService {
  private static isSubmitting = false;

  static async submitGameResult(finalHits: number): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const response = await fetch("/api/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hits: finalHits,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("ゲーム結果が保存されました:", data);
      } else {
        console.error("ゲーム結果の保存に失敗:", data.error);
      }
    } catch (error) {
      console.error("APIエラー:", error);
    } finally {
      this.isSubmitting = false;
    }
  }
}