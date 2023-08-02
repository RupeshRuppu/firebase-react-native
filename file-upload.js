import {View, Text, Button, Image, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/AntDesign';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import ImagePicker from 'react-native-image-crop-picker';
import {AnimatedCircularProgress} from 'react-native-circular-progress';

const App = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState('');
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);

  console.log({userId, userProfile});

  useEffect(() => {
    getDocumentOfUserWithUserId();
  }, [userId]);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(authStateChangedEventListener);
    return () => subscriber();
  }, []);

  function getDocumentOfUserWithUserId() {
    if (userId) {
      firestore()
        .collection('users')
        .where('uid', '==', userId)
        .get()
        .then(doc => {
          const document = doc.docs.at(0).data();
          setUserProfile(document.profile);
        })
        .catch(err => {
          console.log('some error happened', err);
        });
    }
  }

  const authStateChangedEventListener = data => {
    if (data) {
      setUser(data.email);
      setUserId(data.uid);
    }
  };

  function handleLogin() {
    auth()
      .signInWithEmailAndPassword('ruppu@test.com', 'password')
      .then(data => {
        setUser(data.user.email);
      })
      .catch(err => {
        console.log(err);
      });
  }

  function handleCreateNewAccount() {
    const user = {
      name: 'Ruppu',
      email: 'ruppu@test.com',
      password: 'password',
      profile: '',
    };

    auth()
      .createUserWithEmailAndPassword(user.email, user.password)
      .then(res => {
        console.log('data', res);

        /* create a record in users collection */
        firestore()
          .collection('users')
          .add({...user, uid: res.user.uid})
          .then(res => {
            console.log('user got added successfully', res.id);
            setUserId(res.id);
          })
          .catch(err => {
            console.log(
              'some error while creating some doc in users collection',
              err,
            );
          });
      })
      .catch(err => {
        console.log('error auth', err);
      });
  }

  async function handleProfilePic() {
    const res = await request(PERMISSIONS.ANDROID.CAMERA);
    if (res === RESULTS.GRANTED) {
      console.log('granted');
      ImagePicker.openCamera({
        width: 300,
        height: 300,
        cropping: false,
      })
        .then(res => {
          console.log(res, 'near 106, through camera');
          setUploading(true);
          const reference = storage().ref(`/profile/${userId}.jpg`);
          const task = reference.putFile(res.path);
          task.on('state_changed', snapShot => {
            const percent =
              (snapShot.bytesTransferred / snapShot.totalBytes) * 100;
            console.log(
              snapShot.bytesTransferred,
              snapShot.totalBytes,
              percent,
            );
            setPercent(percent);
          });
          task.then(async res => {
            setUploading(false);
            console.log('upload done', res);

            const profile = await storage()
              .ref(`/profile/${userId}.jpg`)
              .getDownloadURL();

            firestore()
              .collection('users')
              .where('uid', '==', `${userId}`)
              .limit(1)
              .get()
              .then(data => {
                const documentId = data.docs.at(0).id;

                firestore()
                  .collection('users')
                  .doc(documentId)
                  .update({
                    profile,
                  })
                  .then(data => {
                    console.log('data profile updated successfully', data);
                    setUserProfile(profile);
                  })
                  .catch(err => {
                    console.log('err on updating profile field ', err);
                  });
              })
              .catch(err => {
                console.log('err on getting document reference', err);
              });
          });

          task.catch(err => {
            console.log('upload error', err);
          });
        })
        .catch(err => {
          console.log('error', err);
        });
    }
    if (res === RESULTS.DENIED) {
      console.log('denied');
    }
  }

  async function handleProfilePicGallery() {
    const res = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
    try {
      if (res === RESULTS.GRANTED) {
        console.log('granted');
        ImagePicker.openPicker({
          width: 300,
          height: 300,
          cropping: false,
        })
          .then(async res => {
            setUploading(true);
            const reference = storage().ref(`/profile/${userId}.jpg`);
            const task = reference.putFile(res.path);
            task.on('state_changed', snapShot => {
              const percent =
                (snapShot.bytesTransferred / snapShot.totalBytes) * 100;
              console.log(
                snapShot.bytesTransferred,
                snapShot.totalBytes,
                percent,
              );
              setPercent(percent);
            });
            task.then(async res => {
              setUploading(false);
              console.log('upload done', res);

              const profile = await storage()
                .ref(`/profile/${userId}.jpg`)
                .getDownloadURL();

              firestore()
                .collection('users')
                .where('uid', '==', `${userId}`)
                .limit(1)
                .get()
                .then(data => {
                  const documentId = data.docs.at(0).id;

                  firestore()
                    .collection('users')
                    .doc(documentId)
                    .update({
                      profile,
                    })
                    .then(data => {
                      console.log('data profile updated successfully', data);
                      setUserProfile(profile);
                    })
                    .catch(err => {
                      console.log('err on updating profile field ', err);
                    });
                })
                .catch(err => {
                  console.log('err on getting document reference', err);
                });
            });

            task.catch(err => {
              console.log('upload error', err);
            });
          })
          .catch(err => {
            console.log('error', err);
          });
      }
    } catch (err) {
      console.log('err');
    } finally {
      setUploading(false);
      setPercent(0);
    }

    if (res === RESULTS.DENIED) {
      console.log('denied');
    }
  }

  return (
    <View style={{flex: 1, padding: 10}}>
      {user && <Text>{user}</Text>}
      <View style={{width: 150, marginTop: 10, gap: 10}}>
        <Button onPress={handleLogin} title="Login" />
        <Button onPress={handleCreateNewAccount} title="Create Account" />
        <Button
          onPress={() => {
            auth()
              .signOut()
              .then(d => {
                console.log({d});
              })
              .catch(err => {
                console.log(err);
              });
          }}
          title="LOGOUT"
        />
        <Icon name="forward" size={30} color={'#f51767'} />
      </View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 20,
          color: 'black',
          fontFamily: 'Manrope',
        }}>
        Hello World
      </Text>
      <View>
        {userProfile === '' ? (
          <Icon name="user" size={30} color={'black'} />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              overflow: 'hidden',
            }}>
            <Image
              source={{uri: userProfile}}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                resizeMode: 'cover',
              }}
            />
          </View>
        )}
      </View>

      {uploading && (
        <View style={{marginVertical: 20}}>
          <AnimatedCircularProgress
            size={120}
            width={15}
            fill={100}
            tintColor="#00e0ff"
            onAnimationComplete={() => console.log('onAnimationComplete')}
            backgroundColor="#3d5875"
          />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.5}
        style={{
          marginTop: 10,
          backgroundColor: '#CCC',
          width: 200,
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          borderRadius: 4,
        }}
        onPress={handleProfilePic}>
        <Text style={{fontFamily: 'Manrope-SemiBold', color: '#000000'}}>
          Upload Profile Pic Camera
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.5}
        style={{
          marginTop: 10,
          backgroundColor: '#CCC',
          width: 200,
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          borderRadius: 4,
        }}
        onPress={handleProfilePicGallery}>
        <Text style={{fontFamily: 'Manrope-SemiBold', color: '#000000'}}>
          Upload Profile Gallery
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;
