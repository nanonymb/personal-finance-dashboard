import React from 'react';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header>
      <h1>{t('header.title')}</h1>
      <p>{t('header.description')}</p>
    </header>
  );
};

export default Header;