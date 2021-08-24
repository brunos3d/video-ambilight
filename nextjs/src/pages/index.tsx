import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';

import VideoAmbilight from '../components/VideoAmbilight';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <VideoAmbilight videoId="ASzOzrB-a9E" />
    </div>
  );
};

export default Home;
