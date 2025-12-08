import React from 'react';
import { useSystem } from '../context/SystemContext';
import ClinicApiDocs from './ClinicApiDocs';
import PosApiDocs from './PosApiDocs';

const ApiDocs: React.FC = () => {
  const { product } = useSystem();

  return product === 'CLINIC' ? <ClinicApiDocs /> : <PosApiDocs />;
};

export default ApiDocs;