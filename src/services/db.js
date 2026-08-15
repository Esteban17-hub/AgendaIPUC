import { openDB } from 'idb';

const DB_NAME = 'deborita_gestion_local_db';
const DB_VERSION = 3;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Migración segura: Creamos los object stores que falten
      const stores = [
        { name: 'users', keyPath: 'id', indexes: [['by_congregation', 'congregationId']] },
        { name: 'congregations', keyPath: 'id' },
        { name: 'committees', keyPath: 'id', indexes: [['by_congregation', 'congregationId']] },
        { name: 'movements', keyPath: 'id', indexes: [['by_committee', 'committeeId'], ['by_congregation', 'congregationId']] },
        { name: 'tithes', keyPath: 'id', indexes: [['by_congregation', 'congregationId']] },
        { name: 'offerings', keyPath: 'id', indexes: [['by_congregation', 'congregationId']] },
        { name: 'projects', keyPath: 'id', indexes: [['by_congregation', 'congregationId']] },
        { name: 'votes', keyPath: 'id', indexes: [['by_project', 'projectId']] },
        { name: 'syncQueue', keyPath: 'id', autoIncrement: true }
      ];

      stores.forEach(storeConfig => {
        if (!db.objectStoreNames.contains(storeConfig.name)) {
          const store = db.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement || false
          });
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(idx => {
              store.createIndex(idx[0], idx[1]);
            });
          }
        }
      });
    },
  });
}

// Datos iniciales de demostración
// Datos iniciales de demostración
export async function seedInitialData() {
  const db = await initDB();
  const tx = db.transaction(['users', 'congregations', 'committees', 'projects', 'tithes', 'offerings', 'movements', 'votes', 'syncQueue'], 'readwrite');
  
  const existingCong = await tx.objectStore('congregations').get('cong-zuluaga');
  
  // Helper para encolar sincronización
  const queueSync = async (action, entity, data) => {
    await tx.objectStore('syncQueue').put({
      action,
      entity,
      data,
      timestamp: Date.now()
    });
  };

  if (existingCong) {
    // Ya existe Zuluaga, nos aseguramos de que los usuarios base tengan PIN
    const u1 = await tx.objectStore('users').get('u-1');
    if (u1 && !u1.pin) {
      const defaultUsers = [
        { id: 'u-1', congregationId: 'cong-zuluaga', name: 'Ever Bustos Ramirez', role: 'ADMIN', pin: '1234', createdAt: Date.now() },
        { id: 'u-2', congregationId: 'cong-zuluaga', name: 'Nubia Castro', role: 'TESORERO', pin: '1234', createdAt: Date.now() },
        { id: 'u-3', congregationId: 'cong-zuluaga', name: 'Visita', role: 'VISITA', pin: '1234', createdAt: Date.now() }
      ];
      for (const u of defaultUsers) {
        await tx.objectStore('users').put(u);
        await queueSync('CREATE', 'users', u);
      }
    }
    await tx.done;
    return;
  }

  const defaultCongregation = {
    id: 'cong-zuluaga',
    name: 'Zuluaga-Central D21',
    city: 'Zuluaga'
  };
  await tx.objectStore('congregations').put(defaultCongregation);
  await queueSync('CREATE', 'congregations', defaultCongregation);

  // Usuarios base de Zuluaga-Central D21
  const defaultUsers = [
    { id: 'u-1', congregationId: 'cong-zuluaga', name: 'Ever Bustos Ramirez', role: 'ADMIN', pin: '1234', createdAt: Date.now() },
    { id: 'u-2', congregationId: 'cong-zuluaga', name: 'Nubia Castro', role: 'TESORERO', pin: '1234', createdAt: Date.now() },
    { id: 'u-3', congregationId: 'cong-zuluaga', name: 'Visita', role: 'VISITA', pin: '1234', createdAt: Date.now() }
  ];
  for (const u of defaultUsers) {
    await tx.objectStore('users').put(u);
    await queueSync('CREATE', 'users', u);
  }

  // Comités Base
  const baseCommittees = [
    'Alabanza', 'Escuela Dominical', 'Familia', 'Intercesión', 
    'Obra Social', 'Misiones', 'Damas Dorcas', 'Decom', 'Jóvenes', 'Ujieres'
  ];

  for (let i = 0; i < baseCommittees.length; i++) {
    const committee = {
      id: `com-zuluaga-${i}`,
      congregationId: 'cong-zuluaga',
      name: baseCommittees[i],
      treasurer: '',
      balance: 0,
      isOfferingOnly: false,
      updatedAt: Date.now()
    };
    await tx.objectStore('committees').put(committee);
    await queueSync('CREATE', 'committees', committee);
  }
  
  // Junta Local (Solo Ofrendas)
  const junta = {
    id: `com-zuluaga-junta`,
    congregationId: 'cong-zuluaga',
    name: 'Junta Local',
    treasurer: '',
    balance: 0,
    isOfferingOnly: true,
    updatedAt: Date.now()
  };
  await tx.objectStore('committees').put(junta);
  await queueSync('CREATE', 'committees', junta);

  await tx.done;
}

// Función helper para clonar comités base al crear nueva congregación
export async function createBaseCommitteesForCongregation(congregationId, tx) {
  const baseCommittees = [
    'Alabanza', 'Escuela Dominical', 'Familia', 'Intercesión', 
    'Obra Social', 'Misiones', 'Damas Dorcas', 'Decom', 'Jóvenes', 'Ujieres'
  ];

  for (let i = 0; i < baseCommittees.length; i++) {
    await tx.objectStore('committees').put({
      id: `com-${congregationId}-${i}-${Date.now()}`,
      congregationId: congregationId,
      name: baseCommittees[i],
      treasurer: '',
      balance: 0,
      isOfferingOnly: false,
      updatedAt: Date.now()
    });
  }
  
  await tx.objectStore('committees').put({
    id: `com-${congregationId}-junta-${Date.now()}`,
    congregationId: congregationId,
    name: 'Junta Local',
    treasurer: '',
    balance: 0,
    isOfferingOnly: true,
    updatedAt: Date.now()
  });
}

// Métodos helper de base de datos
export async function getAllFromStore(storeName) {
  const db = await initDB();
  return db.getAll(storeName);
}

export async function getById(storeName, id) {
  const db = await initDB();
  return db.get(storeName, id);
}

export async function putRecord(storeName, record) {
  const db = await initDB();
  return db.put(storeName, record);
}

export async function deleteRecord(storeName, id) {
  const db = await initDB();
  return db.delete(storeName, id);
}

export async function clearStore(storeName) {
  const db = await initDB();
  return db.clear(storeName);
}
