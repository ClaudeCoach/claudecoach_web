"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FindFolder() {
  const t = useTranslations("upload");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("find_folder_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-base">
        <div>
          <p className="font-semibold mb-1">{t("find_folder_mac_title")}</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>{t("find_folder_mac_1")}</li>
            <li>{t("find_folder_mac_2")}</li>
            <li>{t("find_folder_mac_3")}</li>
            <li className="text-primary">{t("find_folder_mac_4")}</li>
          </ol>
        </div>
        <div>
          <p className="font-semibold mb-1">{t("find_folder_win_title")}</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>{t("find_folder_win_1")}</li>
            <li>{t("find_folder_win_2")}</li>
            <li className="text-primary">{t("find_folder_win_3")}</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
