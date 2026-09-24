import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed do Módulo 13 - Saúde...');

  const randomUnitSuffix = Math.floor(Math.random() * 90000) + 10000;
  
  // 1. Unidades de Saúde
  const ubs1 = await prisma.healthUnit.create({
    data: {
      name: `UBS Centro ${randomUnitSuffix}`,
      type: 'UBS',
      cnes: `123${randomUnitSuffix}`,
      phone: '(11) 9999-0001',
      isActive: true,
    }
  });

  const caps1 = await prisma.healthUnit.create({
    data: {
      name: `CAPS II - Mente Saudável ${randomUnitSuffix}`,
      type: 'CAPS',
      cnes: `765${randomUnitSuffix}`,
      phone: '(11) 9999-0002',
      isActive: true,
    }
  });

  await prisma.healthUnit.create({
    data: {
      name: `Farmácia Municipal Central ${randomUnitSuffix}`,
      type: 'Farmácia',
      cnes: `111${randomUnitSuffix}`,
      phone: '(11) 9999-0003',
      isActive: true,
    }
  });

  // 2. Profissionais de Saúde (com Employee base)
  const profs = [];
  const especialidades = ['Clínico Geral', 'Enfermeiro', 'Pediatra', 'Ginecologista', 'Farmacêutico'];
  const conselhos = ['CRM', 'COREN', 'CRM', 'CRM', 'CRF'];

  for (let i = 0; i < 5; i++) {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const emp = await prisma.employee.create({
      data: {
        name: `Profissional Saúde ${randomSuffix}`,
        cpf: `000000${randomSuffix}`,
        email: `prof${randomSuffix}@saude.gov.br`,
        isActive: true,
      }
    });

    const prof = await prisma.healthProfessional.create({
      data: {
        employeeId: emp.id,
        specialty: especialidades[i],
        councilName: conselhos[i],
        councilNumber: `1000${i}`,
        unitId: i < 2 ? ubs1.id : caps1.id,
        isActive: true,
      }
    });
    profs.push(prof);
  }

  // 3. Equipes ESF
  const team1 = await prisma.healthTeam.create({
    data: {
      name: `Equipe ESF Centro - Azul ${randomUnitSuffix}`,
      code: `ESF-01-${randomUnitSuffix}`,
      microarea: 'Centro e Jardins',
      unitId: ubs1.id,
      isActive: true,
    }
  });

  const team2 = await prisma.healthTeam.create({
    data: {
      name: `Equipe ESF Norte - Verde ${randomUnitSuffix}`,
      code: `ESF-02-${randomUnitSuffix}`,
      microarea: 'Zona Norte',
      unitId: caps1.id,
      isActive: true,
    }
  });

  // 4. Pacientes (com Person base)
  const pacientes = [];
  for (let i = 0; i < 5; i++) {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const person = await prisma.person.create({
      data: {
        fullName: `Paciente Teste ${randomSuffix}`,
        cpf: `111222${randomSuffix}`,
        birthDate: new Date(1980 + i, i, 10),
      }
    });

    const patient = await prisma.patient.create({
      data: {
        personId: person.id,
        cns: `700000000${randomSuffix}`,
        bloodType: i % 2 === 0 ? 'O+' : 'A-',
        referenceUnitId: ubs1.id,
        teamId: i % 2 === 0 ? team1.id : team2.id,
      }
    });
    pacientes.push(patient);
  }

  // 5. Agendamentos
  const agendamentos = [];
  for (let i = 0; i < 10; i++) {
    const ag = await prisma.healthAppointment.create({
      data: {
        date: new Date(Date.now() + (i * 86400000)), // Agendamentos futuros
        specialty: i % 2 === 0 ? 'Clínica Médica' : 'Enfermagem',
        status: i < 3 ? 'Atendido' : 'Agendado',
        patientId: pacientes[i % 5].id,
        unitId: ubs1.id,
        professionalId: profs[i % 2].id,
      }
    });
    agendamentos.push(ag);
  }

  // 6. Atendimentos / Prontuários (MedicalRecord)
  for (let i = 0; i < 3; i++) {
    await prisma.medicalRecord.create({
      data: {
        date: new Date(),
        type: i === 0 ? 'Triagem' : 'Consulta',
        bloodPressure: '120/80',
        temperature: 36.5,
        chiefComplaint: i === 0 ? undefined : 'Dor de cabeça e febre há 3 dias',
        conduct: i === 0 ? undefined : 'Prescrito paracetamol e repouso',
        patientId: pacientes[i].id,
        professionalId: profs[0].id,
        unitId: ubs1.id,
        appointmentId: agendamentos[i].id,
      }
    });
  }

  // 7. Farmácia (Medicamentos e Lotes)
  const meds = [
    { name: 'Paracetamol', active: 'Paracetamol', pres: 'Comprimido', conc: '500mg' },
    { name: 'Amoxicilina', active: 'Amoxicilina', pres: 'Cápsula', conc: '500mg' },
    { name: 'Losartana', active: 'Losartana Potássica', pres: 'Comprimido', conc: '50mg' },
  ];

  for (const m of meds) {
    const randomMedSuffix = Math.floor(Math.random() * 9000) + 1000;
    const med = await prisma.medicine.create({
      data: {
        name: `${m.name} ${randomMedSuffix}`,
        activePrinciple: m.active,
        presentation: m.pres,
        concentration: m.conc,
        currentStock: 1000,
        minStock: 200,
      }
    });

    await prisma.medicineBatch.create({
      data: {
        batchNumber: `LOTE-${Math.floor(Math.random() * 10000)}`,
        expirationDate: new Date(Date.now() + 31536000000), // 1 ano
        quantity: 1000,
        medicineId: med.id,
      }
    });
  }

  // 8. Vacinas
  const vaxList = ['Hepatite B', 'BCG', 'Poliomielite', 'Febre Amarela'];
  for (const v of vaxList) {
    const randomVaxSuffix = Math.floor(Math.random() * 9000) + 1000;
    const vaccine = await prisma.vaccine.create({
      data: {
        name: `${v} ${randomVaxSuffix}`,
        dosesRequired: 2,
      }
    });

    await prisma.vaccinationRecord.create({
      data: {
        date: new Date(),
        doseNumber: 1,
        lotNumber: 'VAX-2026',
        patientId: pacientes[0].id,
        professionalId: profs[1].id, // Enfermeiro
        unitId: ubs1.id,
        vaccineId: vaccine.id,
      }
    });
  }

  console.log('Seed do Módulo 13 - Saúde concluído com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
