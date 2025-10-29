import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonViewProps {
  title: string;
  description?: string;
}

export function ComingSoonView({ title, description }: ComingSoonViewProps) {
  return (
    <div className="grid min-h-[calc(100vh-180px)] place-items-center">
      <Card className="max-w-xl border-dashed border-primary/30 bg-white/80 text-center backdrop-blur-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            {description ??
              "Dieses Modul befindet sich in aktiver Entwicklung. Hinterlegen Sie Feedback, um den Funktionsumfang mitzugestalten."}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 flex flex-col gap-3">
          <Button variant="solid" tone="secondary" className="self-center">
            Feature-Wünsche teilen
          </Button>
          <p className="text-xs text-muted-foreground">
            Wir priorisieren basierend auf Praxiserfolg & Compliance-Anforderungen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
