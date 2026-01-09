import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-deep-black px-6 py-20">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "glass-card shadow-2xl",
            headerTitle: "text-gold",
            headerSubtitle: "text-off-white/70",
            socialButtonsBlockButton:
              "bg-white/5 border border-white/10 text-off-white hover:bg-white/10 hover:border-gold/50",
            formButtonPrimary:
              "bg-gradient-to-r from-gold to-gold/80 text-deep-black hover:from-gold/90 hover:to-gold/70",
            formFieldInput:
              "bg-white/5 border-white/10 text-off-white placeholder:text-off-white/50 focus:border-gold focus:ring-gold/20",
            formFieldLabel: "text-off-white",
            footerActionLink: "text-gold hover:text-gold/80",
            identityPreviewText: "text-off-white",
            identityPreviewEditButton: "text-gold hover:text-gold/80",
            formResendCodeLink: "text-gold hover:text-gold/80",
            otpCodeFieldInput: "bg-white/5 border-white/10 text-off-white focus:border-gold",
            alertText: "text-off-white",
            formFieldErrorText: "text-red-400",
          },
          variables: {
            colorPrimary: "#C4B454",
            colorText: "#E3D3BD",
            colorTextSecondary: "#E3D3BD80",
            colorBackground: "#050505",
            colorInputBackground: "#FFFFFF0D",
            colorInputText: "#E3D3BD",
            borderRadius: "0.5rem",
          },
        }}
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
      />
    </div>
  );
}
