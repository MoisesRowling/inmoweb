import { Logo } from "@/components/shared/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function AuthFormWrapper({ title, description, children }: AuthFormWrapperProps) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="flex items-center space-x-2">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-black text-primary-foreground">IT</span>
                </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
