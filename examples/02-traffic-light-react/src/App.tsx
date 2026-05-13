import { MultiTrafficLight } from '@/components/MultiTrafficLight';
import { SingleTrafficLight } from '@/components/SingleTrafficLight';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeProvider } from '@/providers/ThemeProvider';

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div className="flex min-h-screen flex-col items-center justify-center gap-y-4">
				<Card className="min-w-96">
					<CardHeader className="flex items-center justify-center">
						<CardTitle>Traffic light</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="single">
							<TabsList className="w-full mb-4">
								<TabsTrigger value="single" className="flex-1">
									Single Traffic Light
								</TabsTrigger>
								<TabsTrigger value="multi" className="flex-1">
									Multi Traffic Light
								</TabsTrigger>
							</TabsList>
							<TabsContent value="single" className="flex justify-center">
								<SingleTrafficLight />
							</TabsContent>
							<TabsContent value="multi">
								<MultiTrafficLight />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</ThemeProvider>
	);
}

export default App;
