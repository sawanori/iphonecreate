import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export default function Home() {
  return (
    <main className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">UI Components Test</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content is displayed here.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Input</h2>
        <Input placeholder="Enter text..." className="max-w-md" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Progress</h2>
        <Progress value={60} className="max-w-md" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Video Player Styles</h2>
        <div className="video-container max-w-md">
          <div className="choice-overlay">
            <Button className="choice-button">Choice Button</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
