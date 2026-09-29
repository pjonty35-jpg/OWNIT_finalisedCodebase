import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="label-caps">404</p>
      <h1 className="headline mt-4 text-5xl sm:text-6xl">Lost the thread.</h1>
      <p className="mt-4 max-w-sm text-sm text-mute">
        This page doesn&apos;t exist — but the next great design is still out there.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <ButtonLink href="/create" variant="outline">Open the studio</ButtonLink>
      </div>
    </div>
  );
}
