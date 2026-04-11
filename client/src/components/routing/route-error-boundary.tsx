import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route error boundary:", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              The app hit an unexpected error. You can try again or go back to a safe page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/">Go home</Link>
            </Button>
          </CardContent>
          {import.meta.env.DEV ? (
            <CardContent className="border-t pt-0 text-left">
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none font-medium text-foreground">Error details</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-2">
                  {error.message}
                  {error.stack ? `\n\n${error.stack}` : ""}
                </pre>
              </details>
            </CardContent>
          ) : null}
        </Card>
      </div>
    );
  }
}
