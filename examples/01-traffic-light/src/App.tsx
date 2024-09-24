import { ThemeProvider } from '@/components/ThemeProvider';
import { TrafficLightReact } from '@/components/TrafficLight_react';
import { TrafficLightRedux } from '@/components/TrafficLight_redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { store } from '@/redux/store';
import { Provider } from 'react-redux';

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Provider store={store}>
				<div className="flex min-h-screen flex-col items-center justify-center gap-y-4">
					<Card className="min-w-96">
						<CardHeader className="flex items-center justify-center">
							<CardTitle>Traffic light (Redux)</CardTitle>
						</CardHeader>
						<CardContent>
							<TrafficLightRedux />
						</CardContent>
					</Card>
					<Card className="min-w-96">
						<CardHeader className="flex items-center justify-center">
							<CardTitle>Traffic light (React)</CardTitle>
						</CardHeader>
						<CardContent>
							<TrafficLightReact />
						</CardContent>
					</Card>
				</div>
			</Provider>
		</ThemeProvider>
	);
}

export default App;
