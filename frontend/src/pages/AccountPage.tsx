// 🔌 ІМПОРТИ
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import socket from '../sockets/socket'
import './AccountPage.css'

// 📄 КОМПОНЕНТ
function AccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [username, setUsername] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [friends, setFriends] = useState<string[]>([])
  const [friendInput, setFriendInput] = useState('')
  const [friendRequests, setFriendRequests] = useState<string[]>([])
  const [level, setLevel] = useState(1)
  const [experience, setExperience] = useState(0)
  const [achievements, setAchievements] = useState<string[]>([])

  // ⏳ ЗАГРУЗКА ДАНИХ
  useEffect(() => {
    const user = sessionStorage.getItem('username')
    setUsername(user)

    if (user) {
      const load = (key: string, fallback: any) =>
        JSON.parse(localStorage.getItem(`${key}_${user}`) || JSON.stringify(fallback))

      setProfileImage(localStorage.getItem(`profileImage_${user}`))
      setFriends(load('friends', []))
      setFriendRequests(load('friendRequests', []))
      setLevel(Number(localStorage.getItem(`level_${user}`) || 1))
      setExperience(Number(localStorage.getItem(`experience_${user}`) || 0))
      setAchievements(load('achievements', []))

      // 🟢 Socket: повідомити сервер про нового юзера
      socket.emit('registerUsername', user)

      // 🟢 Socket: отримати поточні запити та друзі
      socket.emit('getFriendData', { username: user })

      socket.on('friendData', (data) => {
        setFriendRequests(data.requests || [])
        setFriends(data.friends || [])
        localStorage.setItem(`friendRequests_${user}`, JSON.stringify(data.requests || []))
        localStorage.setItem(`friends_${user}`, JSON.stringify(data.friends || []))
      })

      socket.on('friendRequestReceived', (data) => {
        const requests = data.requests || []
        setFriendRequests(requests)
        localStorage.setItem(`friendRequests_${user}`, JSON.stringify(requests))
      })

      socket.on('friendAdded', (data) => {
        setFriends(data.friends || [])
        setFriendRequests(data.requests || [])
        localStorage.setItem(`friends_${user}`, JSON.stringify(data.friends || []))
        localStorage.setItem(`friendRequests_${user}`, JSON.stringify(data.requests || []))
      })

      socket.on('friendRemoved', (data) => {
        setFriends(data.friends || [])
        localStorage.setItem(`friends_${user}`, JSON.stringify(data.friends || []))
      })
    }

    return () => {
      socket.off('friendData')
      socket.off('friendRequestReceived')
      socket.off('friendAdded')
      socket.off('friendRemoved')
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('username')
    navigate('/')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && username) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setProfileImage(result)
        localStorage.setItem(`profileImage_${username}`, result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddFriend = () => {
    if (!username) return
    const trimmed = friendInput.trim()

    if (trimmed && trimmed !== username) {
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
      if (!allUsers.includes(trimmed)) {
        alert(t('user_not_exist'))
        return
      }

      const currentFriends = JSON.parse(localStorage.getItem(`friends_${username}`) || '[]')
      if (currentFriends.includes(trimmed)) {
        alert(t('already_friends'))
        return
      }

      const targetRequestsKey = `friendRequests_${trimmed}`
      const targetRequests = JSON.parse(localStorage.getItem(targetRequestsKey) || '[]')

      if (!targetRequests.includes(username)) {
        targetRequests.push(username)
        localStorage.setItem(targetRequestsKey, JSON.stringify(targetRequests))
        alert(`${t('request_sent')} ${trimmed}`)
        setFriendInput('')
        socket.emit('sendFriendRequest', { to: trimmed, from: username })
      } else {
        alert(t('request_exists'))
      }
    }
  }

  const acceptFriendRequest = (sender: string) => {
    if (!username) return
    socket.emit('acceptFriendRequest', {
      requester: sender,
      acceptor: username,
    })
  }

  const rejectFriendRequest = (sender: string) => {
    if (!username) return
    const updatedRequests = friendRequests.filter((req) => req !== sender)
    setFriendRequests(updatedRequests)
    localStorage.setItem(`friendRequests_${username}`, JSON.stringify(updatedRequests))
    // ❌ НЕ сповіщаємо іншого юзера
    socket.emit('rejectFriendRequest', {
      from: sender,
      to: username,
    })
  }

  const removeFriend = (friendName: string) => {
    if (!username) return
    socket.emit('removeFriend', {
      user: username,
      friendToRemove: friendName,
    })
  }

  const addExperience = (amount: number) => {
    if (!username) return
    let newExp = experience + amount
    let newLevel = level
    const threshold = 100
    while (newExp >= threshold) {
      newExp -= threshold
      newLevel += 1
    }
    setExperience(newExp)
    setLevel(newLevel)
    localStorage.setItem(`experience_${username}`, newExp.toString())
    localStorage.setItem(`level_${username}`, newLevel.toString())
  }

  const addAchievement = (name: string) => {
    if (!username) return
    if (!achievements.includes(name)) {
      const updated = [...achievements, name]
      setAchievements(updated)
      localStorage.setItem(`achievements_${username}`, JSON.stringify(updated))
    }
  }

  if (!username) {
    return (
      <div className="account-page">
        <div className="account-form">
          <h2>{t('not_logged_in')}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="account-page">
      {/* Achievements */}
      <div className="achievements-box">
        <h4>{t('achievements')}:</h4>
        {achievements.length === 0 ? <p>{t('no_achievements')}</p> : (
          <ul>
            {achievements.map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        )}
        <button onClick={() => addAchievement('🏅 First Achievement')}>{t('add_achievement')}</button>
      </div>

      {/* Friends & Requests */}
      <div className="friend-request-box">
        <input
          type="text"
          placeholder={t('friend_placeholder')}
          value={friendInput}
          onChange={(e) => setFriendInput(e.target.value)}
        />
        <button onClick={handleAddFriend}>{t('invite_friend')}</button>

        {friendRequests.length > 0 && (
          <div>
            <h4>{t('friend_requests')}:</h4>
            <ul>
              {friendRequests.map((req: string, i: number) => (
                <li key={i}>
                  {req}
                  <button onClick={() => acceptFriendRequest(req)}>✅</button>
                  <button onClick={() => rejectFriendRequest(req)}>❌</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="friend-list-box">
          <h4>{t('friends')}:</h4>
          {friends.length === 0 ? <p>{t('no_friends')}</p> : (
            <ul>
              {friends.map((f: string, i: number) => (
                <li key={i}>
                  {f}
                  <button onClick={() => removeFriend(f)}>❌</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="account-form">
        <h1>{t('profile_title')}</h1>
        {profileImage && <img src={profileImage} alt="Avatar" className="profile-img" />}
        <input type="file" onChange={handleImageUpload} accept="image/*" />
        <p><strong>{t('username')}:</strong> {username}</p>
        <p><strong>{t('level')}:</strong> {level}</p>
        <p><strong>{t('experience')}:</strong> {experience}/100</p>
        <button onClick={() => addExperience(30)}>{t('add_experience')}</button>
        <br /><br />
        <button onClick={handleLogout}>{t('logout')}</button>
      </div>
    </div>
  )
}

export default AccountPage
