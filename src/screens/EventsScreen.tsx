// src/screens/EventsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Event = {
  id: string;
  name: string;
  date: string;
  amountSpent: number; // Valor gasto
  items: { id: string; name: string; amount: number }[]; // Itens arrecadados
};

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventAmountSpent, setNewEventAmountSpent] = useState('');
  const [items, setItems] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await AsyncStorage.getItem('events');
      if (data) setEvents(JSON.parse(data));
    } catch (error) {
      console.log('Erro ao carregar eventos:', error);
    }
  };

  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
    } catch (error) {
      console.log('Erro ao salvar eventos:', error);
    }
  };

  const addItem = () => {
    if (!itemName || !itemAmount) {
      Alert.alert('Erro', 'Preencha o nome e o valor do item.');
      return;
    }
    const newItem = { id: String(Date.now()), name: itemName, amount: parseFloat(itemAmount) };
    setItems([...items, newItem]);
    setItemName('');
    setItemAmount('');
  };

  const openEventModal = (event: Event | null = null) => {
    if (event) {
      setSelectedEvent(event);
      setNewEventName(event.name);
      setNewEventDate(event.date);
      setNewEventAmountSpent(event.amountSpent.toString());
      setItems(event.items);
    } else {
      resetModalFields();
    }
    setModalVisible(true);
  };

  const resetModalFields = () => {
    setSelectedEvent(null);
    setNewEventName('');
    setNewEventDate('');
    setNewEventAmountSpent('');
    setItems([]);
  };

  const saveOrUpdateEvent = () => {
    if (!newEventName || !newEventDate || !newEventAmountSpent) {
      Alert.alert('Erro', 'Preencha todos os campos do evento.');
      return;
    }

    const totalArrecadado = items.reduce((sum, item) => sum + item.amount, 0);
    const updatedEvent: Event = {
      id: selectedEvent ? selectedEvent.id : String(Date.now()),
      name: newEventName,
      date: newEventDate,
      amountSpent: parseFloat(newEventAmountSpent),
      items: [...items],
    };

    const updatedEvents = selectedEvent
      ? events.map((event) => (event.id === selectedEvent.id ? updatedEvent : event))
      : [...events, updatedEvent];

    saveEvents(updatedEvents);
    resetModalFields();
    setModalVisible(false);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Eventos</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const totalArrecadado = item.items.reduce((sum, i) => sum + i.amount, 0);
          const lucro = totalArrecadado - item.amountSpent;
          return (
            <TouchableOpacity onPress={() => openEventModal(item)} style={styles.eventItem}>
              <Text style={styles.eventName}>{item.name}</Text>
              <Text>Data: {item.date}</Text>
              <Text style={styles.amountSpent}>Valor Gasto: R$ {item.amountSpent.toFixed(2)}</Text>
              <Text style={styles.amountEarned}>Total Arrecadado: R$ {totalArrecadado.toFixed(2)}</Text>
              <Text>Lucro: R$ {lucro.toFixed(2)}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum evento encontrado.</Text>}
      />
      <TouchableOpacity onPress={() => openEventModal(null)} style={styles.addButton}>
        <Text style={styles.addButtonText}>Adicionar Evento</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do Evento"
              value={newEventName}
              onChangeText={setNewEventName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Data do Evento (YYYY-MM-DD)"
              value={newEventDate}
              onChangeText={setNewEventDate}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Valor Gasto"
              keyboardType="numeric"
              value={newEventAmountSpent}
              onChangeText={setNewEventAmountSpent}
            />

            <Text style={styles.modalSubtitle}>Itens Arrecadados</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do Item"
              value={itemName}
              onChangeText={setItemName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Valor do Item"
              keyboardType="numeric"
              value={itemAmount}
              onChangeText={setItemAmount}
            />
            <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
              <Text style={styles.addItemButtonText}>Adicionar Item</Text>
            </TouchableOpacity>

            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.itemList}>
                  <Text>{item.name}: R$ {item.amount.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteItemButton}>
                    <Text style={styles.deleteItemButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum item adicionado.</Text>}
            />

            <Button title={selectedEvent ? 'Salvar Alterações' : 'Adicionar Evento'} onPress={saveOrUpdateEvent} />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f8f8' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  addButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 16 },
  addButtonText: { color: 'white', fontSize: 16 },
  eventItem: { padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, elevation: 1 },
  eventName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  amountSpent: { color: 'red' },
  amountEarned: { color: 'green' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20 },

  // Estilos para o modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 16, height: 40 },
  modalSubtitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  addItemButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  addItemButtonText: { color: '#fff' },
  itemList: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  deleteItemButton: { backgroundColor: '#FF4D4D', borderRadius: 5, padding: 4 },
  deleteItemButtonText: { color: 'white' },
});
