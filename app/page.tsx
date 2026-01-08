import Link from "next/link";
import {
  ArrowRight,
  LucideIcon,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const features: Feature[] = [
  {
    title: "Скорость",
    description:
      "Рендеринг Flux AI без ожиданий: мгновенные предпросмотры, очереди и готовые пресеты.",
    icon: Zap,
    accent: "from-emerald-400/80 via-emerald-500/60 to-emerald-300/70",
  },
  {
    title: "Качество",
    description:
      "Глубокие детали, контроль стиля и четкие лица. PixelStage оптимизирует промпты под Flux.",
    icon: Sparkles,
    accent: "from-sky-400/70 via-cyan-400/60 to-blue-300/70",
  },
  {
    title: "Безопасность",
    description:
      "Приватные проекты, защищенные ассеты и аудит действий. Ваши идеи остаются вашими.",
    icon: ShieldCheck,
    accent: "from-fuchsia-400/70 via-purple-500/60 to-indigo-400/70",
  },
];

const HomePage = () => {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="absolute inset-0 -z-10 opacity-60 blur-3xl" aria-hidden>
        <div className="absolute left-10 top-10 h-80 w-80 rounded-full bg-emerald-500/20" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-fuchsia-500/20" />
        <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/15" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-16 lg:px-12 lg:py-20">
        <header className="flex flex-col gap-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm text-emerald-100 ring-1 ring-inset ring-white/10 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Flux AI внутри PixelStage
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-emerald-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                Преврати идеи в искусство с PixelStage
              </span>
            </h1>
            <p className="text-lg text-zinc-300 sm:text-xl">
              Создавайте кинематографичные визуалы на базе Flux AI. Пишите
              промпты, работайте с раскадровками и экспортируйте готовые
              ассеты, не покидая PixelStage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="group gap-2 bg-white text-black transition hover:bg-zinc-100"
            >
              <Link href="/dashboard">
                Начать творить
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <span className="text-sm text-zinc-400">
              Неограниченные эксперименты на старте.
            </span>
          </div>
        </header>

        <section className="mt-16 flex flex-col gap-8 lg:mt-20">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-200/80">
              Возможности
            </p>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Создано для креаторов и команд
            </h2>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              PixelStage объединяет лучшие практики генерации: мгновенные
              результаты, гибкая настройка и безопасность на уровне продакшена.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, description, icon: Icon, accent }) => (
              <Card
                key={title}
                className="group relative overflow-hidden border-white/10 bg-white/5 shadow-lg ring-1 ring-white/10 transition hover:-translate-y-1 hover:shadow-emerald-500/20"
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-20",
                    "bg-gradient-to-br",
                    accent,
                  )}
                  aria-hidden
                />
                <CardHeader className="relative flex flex-row items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10">
                    <Icon className="h-6 w-6 text-emerald-300" />
                  </div>
                  <CardTitle className="text-lg text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent className="relative text-sm text-zinc-300">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="mt-auto border-t border-white/10 pt-10 text-sm text-zinc-400">
          © {new Date().getFullYear()} PixelStage. Все права защищены.
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
