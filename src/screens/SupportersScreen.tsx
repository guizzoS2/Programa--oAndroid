import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Supporter = {
  id: string;
  name: string;
  paymentStatus: 'Pendente' | 'Pago';
  paymentHistory: { month: string; status: 'Pendente' | 'Pago' }[];
};

export default function SupportersScreen() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [newSupporterName, setNewSupporterName] = useState('');

  useEffect(() => {
    loadSupporters();
  }, []);

  const loadSupporters = async () => {
    try {
      const data = await AsyncStorage.getItem('supporters');
      if (data) {
        setSupporters(JSON.parse(data));
      }
    } catch (error) {
      console.log('Erro ao carregar apoiadores:', error);
    }
  };

  const saveSupporters = async (updatedSupporters: Supporter[]) => {
    try {
      await AsyncStorage.setItem('supporters', JSON.stringify(updatedSupporters));
      setSupporters(updatedSupporters);
    } catch (error) {
      console.log('Erro ao salvar apoiadores:', error);
    }
  };

  const addSupporter = () => {
    if (newSupporterName.trim() === '') {
      Alert.alert('Erro', 'Por favor, insira um nome para o novo apoiador.');
      return;
    }

    const newSupporter: Supporter = {
      id: String(Date.now()),
      name: newSupporterName,
      paymentStatus: 'Pendente',
      paymentHistory: [{ month: new Date().toISOString().slice(0, 7), status: 'Pendente' }],
    };

    const updatedSupporters = [...supporters, newSupporter];
    saveSupporters(updatedSupporters);
    setNewSupporterName('');
    setModalVisible(false);
  };

  const registerPayment = (id: string) => {
    const updatedSupporters = supporters.map((supporter) => {
      if (supporter.id === id) {
        return {
          ...supporter,
          paymentStatus: 'Pago',
          paymentHistory: [
            ...supporter.paymentHistory,
            { month: new Date().toISOString().slice(0, 7), status: 'Pago' },
          ],
        };
      }
      return supporter;
    });
    saveSupporters(updatedSupporters);
  };

  const removePayment = (id: string) => {
    const updatedSupporters = supporters.map((supporter) => {
      if (supporter.id === id) {
        return { ...supporter, paymentStatus: 'Pendente' };
      }
      return supporter;
    });
    saveSupporters(updatedSupporters);
  };

  const resetPaymentsForNewMonth = () => {
    const updatedSupporters = supporters.map((supporter) => ({
      ...supporter,
      paymentStatus: 'Pendente',
    }));
    saveSupporters(updatedSupporters);
    Alert.alert('Atualização', 'Todos os status foram definidos como "Pendente" para o novo mês.');
  };

  const deleteSupporter = (id: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este apoiador?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            const updatedSupporters = supporters.filter((supporter) => supporter.id !== id);
            saveSupporters(updatedSupporters);
          }
        }
      ]
    );
  };

  const filteredSupporters = supporters.filter((supporter) =>
    supporter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSupporters = supporters.length;
  const paidSupporters = supporters.filter((supporter) => supporter.paymentStatus === 'Pago').length;
  const totalPaidValue = paidSupporters * 50; // Assuming each payment is 50 (adjust if variable)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Apoiadores - Formiguinhas</Text>
        <TouchableOpacity onPress={resetPaymentsForNewMonth} style={styles.clockButton}>
          <Icon name="access-time" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Buscar apoiador..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredSupporters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.supporterItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.supporterName}>{item.name}</Text>
              <Text style={styles.paymentStatus}>Status: {item.paymentStatus}</Text>
            </View>
            {item.paymentStatus === 'Pendente' ? (
              <TouchableOpacity onPress={() => registerPayment(item.id)} style={styles.paymentButton}>
                <Text style={styles.paymentButtonText}>Registrar Pagamento</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => removePayment(item.id)} style={styles.paymentButton}>
                <Text style={styles.paymentButtonText}>Remover Pagamento</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteSupporter(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum apoiador encontrado.</Text>}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Novo Apoiador</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do Apoiador"
              value={newSupporterName}
              onChangeText={setNewSupporterName}
            />
            <Button title="Adicionar" onPress={addSupporter} />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text>Total de Apoiadores: {totalSupporters}</Text>
        <Text>Pagos: {paidSupporters}</Text>
        <Text>Total Recebido: R$ {totalPaidValue.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  clockButton: { backgroundColor: '#FFA500', padding: 8, borderRadius: 20, marginRight: 8 },
  addButton: { backgroundColor: '#007AFF', padding: 8, borderRadius: 20 },
  searchBar: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 16 },
  supporterItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, elevation: 1 },
  supporterName: { fontSize: 16, fontWeight: 'bold' },
  paymentStatus: { fontSize: 14, color: '#555' },
  paymentButton: { padding: 8, backgroundColor: '#28a745', borderRadius: 8, marginLeft: 8 },
  paymentButtonText: { color: '#fff' },
  deleteButton: { padding: 8, backgroundColor: '#FF4D4D', borderRadius: 8, marginLeft: 8 },
  deleteButtonText: { color: '#fff' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20 },

  // Estilos para o modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 16, height: 40 },

  // Estilos para o rodapé
  footer: { padding: 16, alignItems: 'center', backgroundColor: '#f8f8f8', borderTopWidth: 1, borderColor: '#ddd' },
});
