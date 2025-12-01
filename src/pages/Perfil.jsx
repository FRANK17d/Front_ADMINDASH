import { useEffect } from 'react'
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import React from 'react'
import ComponentCard from '../components/common/ComponentCard';

const Perfil = () => {
    useEffect(() => {
        document.title = 'Perfil - Hotel Plaza Trujillo'
    }, [])
  return (
    <>
      <div className="space-y-6">
        <ComponentCard title="Perfil">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </ComponentCard>
      </div>
    </>
  )
}

export default Perfil