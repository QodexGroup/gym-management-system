import { User, HeartPulse, Phone } from 'lucide-react';
import { SectionCard, InfoField } from '../../../components/common';

const ProfileTab = ({ member }) => {
  if (!member) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Personal Information */}
      <SectionCard icon={User} title="Personal Information">
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Full Name" value={member.name} valueClassName="text-dark-50 font-medium" />
          <InfoField label="Gender" value={member.gender} />
          <InfoField label="Age" value={member.age ? `${member.age} years old` : null} />
          <InfoField label="Birthday" value={member.birthDate} />
          <InfoField label="Email" value={member.email} />
          <InfoField label="Phone" value={member.phone} />
          <InfoField label="Address" value={member.address} className="col-span-2" />
        </div>
      </SectionCard>

      {/* Health & Emergency */}
      <SectionCard icon={HeartPulse} title="Health & Emergency">
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Blood Type" value={member.bloodType} />
          <InfoField
            label="Allergies"
            value={member.allergies}
            valueClassName={member.allergies ? 'text-warning-600 font-medium' : 'text-dark-100'}
          />
          <InfoField
            label="Medical Conditions"
            value={member.medicalConditions}
            valueClassName={member.medicalConditions ? 'text-danger-600 font-medium' : 'text-dark-100'}
          />
          <InfoField label="Current Medications" value={member.currentMedications} />
          <InfoField label="Doctor Name" value={member.doctorName} />
          <InfoField label="Doctor Phone" value={member.doctorPhone} />
          <InfoField label="Insurance Provider" value={member.insuranceProvider} />
          <InfoField label="Policy Number" value={member.insurancePolicyNumber} />
          <InfoField label="Medical Notes" value={member.medicalNotes} className="col-span-2" />
        </div>
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard icon={Phone} title="Emergency Contact">
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Contact Name" value={member.emergencyContactName} valueClassName="text-dark-50 font-medium" />
          <InfoField label="Relationship" value={member.emergencyContactRelationship} />
          <InfoField label="Phone" value={member.emergencyContactPhone} />
          <InfoField label="Address" value={member.emergencyContactAddress} className="col-span-2" />
        </div>
      </SectionCard>
    </div>
  );
};

export default ProfileTab;
