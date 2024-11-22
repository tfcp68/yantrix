import { Checkbox } from '@/components/Checkbox';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div className="flex min-h-screen flex-col items-center justify-center gap-y-4">
				<Card className="min-w-80">
					<CardHeader className="flex items-center justify-center">
						<CardTitle>Checkbox</CardTitle>
					</CardHeader>
					<CardContent>
						<Checkbox />
					</CardContent>
				</Card>
			</div>
		</ThemeProvider>
	);
}

export default App;
