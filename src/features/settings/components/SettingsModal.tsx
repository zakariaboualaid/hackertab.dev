import React, { useState } from 'react'
import { VscClose } from 'react-icons/vsc'
import ReactModal from 'react-modal'
import Select, { ActionMeta, MultiValue, SingleValue } from 'react-select'
import Toggle from 'react-toggle'
import 'react-toggle/style.css'
import { Footer } from 'src/components/Layout'
import { SUPPORTED_CARDS, SUPPORTED_SEARCH_ENGINES, supportLink } from 'src/config'
import { Tag, useRemoteConfigStore } from 'src/features/remoteConfig'
import {
  identifyUserCards,
  identifyUserLanguages,
  identifyUserLinksInNewTab,
  identifyUserListingMode,
  identifyUserSearchEngine,
  identifyUserTheme,
  trackLanguageAdd,
  trackLanguageRemove,
  trackListingModeSelect,
  trackSearchEngineSelect,
  trackSourceAdd,
  trackSourceRemove,
  trackTabTarget,
  trackThemeSelect,
} from 'src/lib/analytics'
import { useUserPreferences } from 'src/stores/preferences'
import { SearchEngineType, SelectedCard } from 'src/types'
import { RssSetting } from './RssSetting'
import './settings.css'

type SettingsModalProps = {
  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

type OptionType = {
  value: string
  label: string
}

export const SettingsModal = ({ showSettings, setShowSettings }: SettingsModalProps) => {
  const { supportedTags } = useRemoteConfigStore()

  const {
    cards,
    userSelectedTags,
    openLinksNewTab,
    listingMode,
    theme,
    searchEngine,
    setTheme,
    setListingMode,
    setSearchEngine,
    setOpenLinksNewTab,
    setCards,
    setTags,
    userCustomCards,
    setUserCustomCards,
  } = useUserPreferences()
  const [selectedCards, setSelectedCards] = useState(cards)

  const AVAILABLE_CARDS = [...SUPPORTED_CARDS, ...userCustomCards]

  const handleCloseModal = () => {
    setShowSettings(false)
  }

  const onTagsSelectChange = (tags: MultiValue<Tag>, metas: ActionMeta<OptionType>) => {
    switch (metas.action) {
      case 'select-option':
        if (metas.option?.label) {
          trackLanguageAdd(metas.option.label)
        }
        break
      case 'remove-value':
        if (metas.removedValue?.label) {
          trackLanguageRemove(metas.removedValue.label)
        }

        break
    }
    setTags(tags as Tag[])
    identifyUserLanguages(tags.map((tag) => tag.value))
  }

  const onlistingModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked ? 'compact' : 'normal'
    trackListingModeSelect(value)
    identifyUserListingMode(value)
    setListingMode(value)
  }

  const onCardSelectChange = (cards: MultiValue<OptionType>, metas: ActionMeta<OptionType>) => {
    switch (metas.action) {
      case 'select-option':
        if (metas.option?.label) {
          trackSourceAdd(metas.option.label)
        }
        break
      case 'remove-value':
        // if removed card is a userCustomCard, remove it
        const newUserCustomCards = userCustomCards.filter(
          (c) => c.value !== metas.removedValue.value
        )
        setUserCustomCards(newUserCustomCards)
        if (metas.removedValue?.label) {
          trackSourceRemove(metas.removedValue.label)
        }
        break
    }

    let newCards = cards.map((c, index) => {
      // Re-Check
      let type = AVAILABLE_CARDS.find((ac) => ac.value === c.value)?.type
      return { id: index, name: c.value, type }
    }) as SelectedCard[]

    identifyUserCards(newCards.map((card) => card.name))
    setSelectedCards(newCards)
    setCards(newCards)
  }

  const onSearchEngineSelectChange = (value: SingleValue<SearchEngineType>) => {
    if (!value) {
      return
    }

    identifyUserSearchEngine(value.label)
    trackSearchEngineSelect(value.label)
    setSearchEngine(value.label)
  }

  const onOpenLinksNewTabChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    trackTabTarget(checked)
    identifyUserLinksInNewTab(checked)
    setOpenLinksNewTab(checked)
  }

  const onDarkModeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    trackThemeSelect(newTheme)
    identifyUserTheme(newTheme)
  }

  return (
    <ReactModal
      isOpen={showSettings}
      ariaHideApp={false}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      shouldFocusAfterRender={false}
      onRequestClose={() => handleCloseModal()}
      contentLabel="Minimal Modal Example"
      className="Modal"
      style={{
        overlay: {
          zIndex: 3,
        },
      }}
      overlayClassName="Overlay">
      <div className="modalHeader">
        <h1 className="modalTitle">Settings</h1>
        <button className="modalCloseBtn" onClick={handleCloseModal}>
          <VscClose size="24" />
        </button>
      </div>

      <div className="settings">
        <div className="settingRow">
          <p className="settingTitle">Programming languages you're interested in</p>
          <div className="settingContent">
            <Select
              options={supportedTags}
              defaultValue={userSelectedTags}
              isMulti={true}
              isClearable={false}
              isSearchable={false}
              classNamePrefix={'hackertab'}
              onChange={onTagsSelectChange}
            />
            <p className="settingHint">
              Missing language or technology? create an issue{' '}
              <a href={supportLink} target="_blank" rel="noreferrer">
                here
              </a>
            </p>
          </div>
        </div>

        <div className="settingRow">
          <p className="settingTitle">Displayed Cards</p>
          <div className="settingContent">
            <Select
              options={AVAILABLE_CARDS}
              value={selectedCards.map((c) => ({
                label: AVAILABLE_CARDS.find((c2) => c.name === c2.value)?.label || '',
                value: c.name,
              }))}
              onChange={onCardSelectChange}
              isMulti={true}
              isClearable={false}
              isSearchable={false}
              classNamePrefix={'hackertab'}
            />
            <p className="settingHint">
              Missing a cool data source? Add it below as an RSS or create an issue{' '}
              <a href={supportLink} target="_blank" rel="noreferrer">
                here!
              </a>
            </p>
          </div>
        </div>

        <RssSetting setSelectedCards={setSelectedCards} />

        <div className="settingRow">
          <p className="settingTitle">Dark Mode</p>
          <div className="settingContent">
            <Toggle checked={theme === 'dark'} icons={false} onChange={onDarkModeChange} />
          </div>
        </div>

        <div className="settingRow">
          <p className="settingTitle">Open links in a new tab</p>
          <div className="settingContent">
            <Toggle checked={openLinksNewTab} icons={false} onChange={onOpenLinksNewTabChange} />
          </div>
        </div>

        <div className="settingRow">
          <p className="settingTitle">Compact mode</p>
          <div className="settingContent">
            <Toggle
              checked={listingMode === 'compact'}
              icons={false}
              onChange={onlistingModeChange}
            />
          </div>
        </div>

        <div className="settingRow">
          <p className="settingTitle">Favorite search engine</p>
          <div className="settingContent">
            <Select
              options={SUPPORTED_SEARCH_ENGINES}
              value={SUPPORTED_SEARCH_ENGINES.find((e) => e.label === searchEngine)}
              isMulti={false}
              isClearable={false}
              isSearchable={false}
              classNamePrefix={'hackertab'}
              onChange={onSearchEngineSelectChange}
            />
            <p className="settingHint">
              Missing a search engine? create an issue{' '}
              <a href={supportLink} target="_blank" rel="noreferrer">
                here
              </a>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </ReactModal>
  )
}
