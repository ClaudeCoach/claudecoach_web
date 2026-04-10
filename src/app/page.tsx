"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { DropZone } from "@/components/upload/DropZone";
import { FindFolder } from "@/components/upload/FindFolder";
import { ApiKeyInput } from "@/components/upload/ApiKeyInput";

export default function Home() {
  const t = useTranslations("upload");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12 space-y-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <Image
              src="/logo.jpg"
              alt="ClaudeCoach"
              width={200}
              height={200}
              priority
              className="relative rounded-2xl border border-border shadow-2xl shadow-primary/10"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
              {t("hero_title")}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground">
              {t("hero_sub")}
            </p>
            <p className="text-sm text-primary/80">
              <span className="mr-1">{"//"}</span>
              {t("privacy_note")}
            </p>
          </div>
        </div>

        <FindFolder />

        <DropZone />

        <ApiKeyInput />
      </main>
      <footer className="container mx-auto max-w-3xl px-4 py-8 text-center text-[10px] text-muted-foreground/60">
        {"// claudecoach v1.0 — browser-only, no tracking"}
      </footer>
    </div>
  );
}
