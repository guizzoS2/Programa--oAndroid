import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SupportersScreen from './src/screens/SupportersScreen';
import EventsScreen from './src/screens/EventsScreen';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Apoiadores">
        <Drawer.Screen name="Apoiadores" component={SupportersScreen} />
        <Drawer.Screen name="Eventos" component={EventsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
