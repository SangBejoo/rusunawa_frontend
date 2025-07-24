import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const RoomManagementSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Room Management Testing"
        description="Akses menu Room Management dan test fitur-fitur berikut"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba semua fitur Room Management"
        alertType="info"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Coba buat ruangan baru. Seberapa mudah prosesnya?"
            value={data.room_creation_ease}
            onChange={(value) => updateData('room_creation_ease', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="2. Apakah pilihan klasifikasi ruangan mudah dipahami?"
            value={data.room_classification}
            onChange={(value) => updateData('room_classification', value)}
            options={[
              { value: 'very_easy', label: 'Sangat mudah dipahami' },
              { value: 'easy', label: 'Mudah dipahami' },
              { value: 'moderate', label: 'Cukup mudah dipahami' },
              { value: 'difficult', label: 'Sulit dipahami' },
              { value: 'very_difficult', label: 'Sangat sulit dipahami' }
            ]}
          />

          <ScaleQuestion
            label="3. Coba tambah/edit amenities ruangan. Seberapa mudah?"
            value={data.amenities_management}
            onChange={(value) => updateData('amenities_management', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="4. Coba upload gambar ruangan. Bagaimana hasilnya?"
            value={data.image_upload}
            onChange={(value) => updateData('image_upload', value)}
            options={[
              { value: 'success_good', label: 'Berhasil, gambar tampil dengan baik' },
              { value: 'success_poor', label: 'Berhasil, tapi gambar tidak optimal' },
              { value: 'failed', label: 'Gagal upload' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ]}
          />

          <ScaleQuestion
            label="5. Bagaimana fitur pencarian dan filter ruangan?"
            value={data.room_search_filter}
            onChange={(value) => updateData('room_search_filter', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <TextQuestion
            label="6. Room Management Issues (Opsional)"
            value={data.room_management_issues}
            onChange={(value) => updateData('room_management_issues', value)}
            placeholder="Masalah apa yang ditemukan di Room Management?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default RoomManagementSection;
