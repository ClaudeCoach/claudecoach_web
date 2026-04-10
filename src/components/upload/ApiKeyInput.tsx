"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";

export function ApiKeyInput() {
  const t = useTranslations("upload");
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const existing = storage.getApiKey();
    setValue(existing);
    setSaved(existing);
  }, []);

  function save(v: string) {
    if (v) storage.setApiKey(v);
    else storage.clearApiKey();
    setSaved(v);
  }

  function onDelete() {
    storage.clearApiKey();
    setValue("");
    setSaved("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("api_key_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block text-base font-medium">{t("api_key_label")}</label>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={value}
            placeholder={t("api_key_placeholder")}
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => save(e.target.value)}
            className="flex-1 h-10 rounded border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {saved && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              aria-label={t("api_key_delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("api_key_note")}</p>
        <p className="text-sm text-muted-foreground">{t("api_key_recommend")}</p>
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          {t("api_key_howto")}
        </a>
      </CardContent>
    </Card>
  );
}
