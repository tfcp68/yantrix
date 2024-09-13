import { ThemeProvider } from '@/components/ThemeProvider';
import { TrafficLight } from '@/components/TrafficLight';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { store } from '@/redux/store';
import { Provider } from 'react-redux';

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Provider store={store}>
				<div className="flex min-h-screen flex-col items-center justify-center">
					<Card className="min-w-96">
						<CardHeader className="flex items-center justify-center">
							<CardTitle>Traffic light</CardTitle>
						</CardHeader>
						<CardContent>
							<TrafficLight />
						</CardContent>
					</Card>
				</div>
			</Provider>
		</ThemeProvider>
	);
}

export default App;
