import { ReactNode } from "react";
import { PenTool } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 bg-accent-primary text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary to-accent-primary/80 opacity-90"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <PenTool className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Autopen</h1>
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">
              AI-Powered Content Creation
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Transform your ideas into polished content with our advanced AI
              tools. Write faster, better, and more efficiently.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Intelligent Writing Assistant
                  </h3>
                  <p className="text-white/80">
                    Get AI-powered suggestions and improvements as you write
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Content Organization
                  </h3>
                  <p className="text-white/80">
                    Automatically structure and organize your ideas
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Multi-format Export</h3>
                  <p className="text-white/80">
                    Export your content in multiple formats with one click
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-sm text-white/70">
          © {new Date().getFullYear()} Autopen. All rights reserved.
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">{children}</div>
      </div>
    </div>
  );
}
