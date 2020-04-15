import React from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';

import { NavBar } from './components/navBar';
import { Grid } from './components/grid';
import { IBox, deserializeBox, serializeBox, defaultLayout, createDefaultDevice } from './model';
import { useSizingRef, useUrlQueryState, useLocalStorageState, useStringListLocalStorageState, useValueSync, useFavicon } from './util';
import { Analytics } from './analytics';
import { FloatingActionButton } from './components/floatingActionButton';
import { GlobalCss } from './globalCss';
import { resetCss } from './resetCss';
import favicon from './assets/favicon.svg';


const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const NavbarWrapper = styled.div`
  width: 100%;
  flex-grow: 0;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
`;

const GridWrapper = styled.div`
  width: 100%;
  flex-grow: 1;
  overflow: auto;
`;

const boxListFromStringList = (stringList: string[] | null): IBox[] => {
  if (!stringList) {
    return [];
  }
  return stringList?.map((boxString: string): IBox | null => deserializeBox(boxString)).filter((box: IBox | null): boolean => box !== null) as IBox[];
}

const  boxListToStringList = (boxes: IBox[] | null): string[] | null => {
  if (boxes === null) {
    return boxes;
  }
  return boxes.map((box: IBox): string => serializeBox(box));
}

export const useBoxListLocalStorageState = (name: string, delimiter: string = ',', overrideInitialValue?: IBox[] | null): [IBox[], (newValue: IBox[] | null) => void] => {
  const [value, setValue] = useStringListLocalStorageState(name, delimiter, overrideInitialValue !== undefined ? boxListToStringList(overrideInitialValue) : undefined);
  return [boxListFromStringList(value), ((newValue: IBox[] | null): void => setValue(boxListToStringList(newValue)))];
};

const App = (): React.ReactElement => {
  useFavicon(favicon);
  const [size, gridRef] = useSizingRef<HTMLDivElement>();
  const [boxes, setBoxes] = useBoxListLocalStorageState('boxes_v2');
  const [url, setUrl] = useUrlQueryState('url');
  const [storedUrl, setStoredUrl] = useLocalStorageState('url_v1', url);
  useValueSync(storedUrl, setUrl);

  const [totalWidth, setTotalWidth] = React.useState(10000);
  const rowHeight = 20;
  const columnWidth = 20;
  const paddingSize = 10;
  const minimumGridItemWidth = 250;
  const columnCount = (totalWidth - paddingSize) / (columnWidth + paddingSize);

  React.useEffect((): void => {
    if (!url && !storedUrl) {
      setUrl('https://kibalabs.com');
    }
    if (boxes.length === 0) {
      setBoxes(defaultLayout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUrlChanged = (url: string): void => {
    setStoredUrl(url);
  };

  const onAddClicked = (): void => {
    setBoxes([...boxes, createDefaultDevice()]);
  };

  const onRemoveBoxClicked = (itemId: string): void => {
    setBoxes(boxes.filter((box: IBox): boolean => box.itemId !== itemId));
  };

  const onBoxSizeChanged = (itemId: string, width: number, height: number, zoom: number, deviceCode: string | null) => {
    setBoxes(boxes.map((box: IBox): IBox => (
      box.itemId === itemId ? {...box, width: width, height: height, zoom: zoom, deviceCode: deviceCode} : box
    )));
  };

  const onBoxPositionChanged = (itemId: string, positionX: number, positionY: number): void => {
    setBoxes(boxes.map((box: IBox): IBox => (
      box.itemId === itemId ? {...box, positionX: positionX, positionY: positionY} : box
    )));
  };

  React.useEffect((): void => {
    if (size) {
      setTotalWidth(Math.floor((size.width - paddingSize) / (columnWidth + paddingSize)) * (columnWidth + paddingSize));
    }
  }, [size]);

  return (
    <React.Fragment>
      <Helmet>
        <meta charSet='utf-8' />
        <title>everysize - Check your responsive site in every sizes in one go!</title>
        <meta name='description' content='' />
        <link rel='canonical' href='https://everysize.kibalabs.com' />
      </Helmet>
      <GlobalCss
        resetCss={resetCss}
      />
      <Analytics />
      <AppWrapper ref={gridRef}>
        <NavbarWrapper>
          <NavBar url={url || null} onUrlChanged={onUrlChanged}/>
        </NavbarWrapper>
        <GridWrapper>
          <Grid
            rowHeight={rowHeight}
            columnWidth={columnWidth}
            paddingSize={paddingSize}
            totalWidth={totalWidth}
            minimumGridItemWidth={minimumGridItemWidth}
            columnCount={columnCount}
            url={url || null}
            boxes={boxes}
            onBoxCloseClicked={onRemoveBoxClicked}
            onBoxSizeChanged={onBoxSizeChanged}
            onBoxPositionChanged={onBoxPositionChanged}
          />
        </GridWrapper>
      </AppWrapper>
      <FloatingActionButton onClicked={onAddClicked}/>
    </React.Fragment>
  );
}

export default App;
