import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

export const ThemeContext = createContext();

// Создаем хук для использования контекста темы
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  console.log('useThemeContext called, context:', context);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  console.log('ThemeProvider rendering');
  
  // Получаем сохраненную тему из localStorage или используем светлую тему по умолчанию
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    console.log('ThemeProvider - Initial mode from localStorage:', savedMode);
    return savedMode || 'dark';
  });

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    console.log('ThemeProvider - Mode changed to:', mode);
    localStorage.setItem('theme', mode);
    
    // Добавляем глобальные стили
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = mode === 'light' ? '#FFFFFF' : '#000000';
    document.body.style.minHeight = '100vh';
    document.body.style.width = '100vw';
    document.body.style.overflow = 'hidden auto';
    
    // Добавляем глобальные стили
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;400;500;600;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html, body, #root {
        background-color: ${mode === 'light' ? '#FFFFFF' : '#000000'};
        color: ${mode === 'light' ? '#000000' : '#FFFFFF'};
        min-height: 100vh;
        width: 100vw;
        overflow-x: hidden;
        font-family: 'Unbounded', sans-serif;
      }

      .MuiAppBar-root,
      .MuiToolbar-root,
      .MuiContainer-root,
      .MuiPaper-root {
        background-color: ${mode === 'light' ? '#FFFFFF' : '#000000'} !important;
        background-image: none !important;
      }

      .header {
        background-color: ${mode === 'light' ? '#FFFFFF' : '#000000'} !important;
        background-image: none !important;
      }

      body::before {
        display: none !important;
      }

      .MuiContainer-root {
        display: flex;
        align-items: center;
        padding: 0 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .logo-section {
        flex: 0 0 250px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nav-section {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }

      .actions-section {
        flex: 0 0 250px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
      }
    `;
    document.head.appendChild(style);
  }, [mode]);

  const toggleTheme = () => {
    console.log('toggleTheme called, current mode:', mode);
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      console.log('toggleTheme - changing mode from', prevMode, 'to', newMode);
      return newMode;
    });
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#000000' : '#FFFFFF',
        light: mode === 'light' ? '#000000' : '#FFFFFF',
        dark: mode === 'light' ? '#000000' : '#FFFFFF',
        contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      secondary: {
        main: mode === 'light' ? '#000000' : '#FFFFFF',
        light: mode === 'light' ? '#000000' : '#FFFFFF',
        dark: mode === 'light' ? '#000000' : '#FFFFFF',
        contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      background: {
        default: mode === 'light' ? '#FFFFFF' : '#000000',
        paper: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      text: {
        primary: mode === 'light' ? '#000000' : '#FFFFFF',
        secondary: mode === 'light' ? '#000000' : '#FFFFFF',
      },
    },
    typography: {
      fontFamily: '"Unbounded", sans-serif',
      h1: {
        fontFamily: '"Unbounded", sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: mode === 'light' ? '#000000' : '#FFFFFF',
      },
      h2: { 
        fontFamily: '"Unbounded", sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        color: mode === 'light' ? '#000000' : '#FFFFFF',
      },
      h3: { 
        fontFamily: '"Unbounded", sans-serif',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        color: mode === 'light' ? '#000000' : '#FFFFFF',
      },
      body1: {
        fontFamily: '"Unbounded", sans-serif',
        fontWeight: 400,
        letterSpacing: '0.01em',
        lineHeight: 1.8,
        color: mode === 'light' ? '#000000' : '#FFFFFF',
        fontSize: '1.125rem',
      },
      body2: {
        fontFamily: '"Unbounded", sans-serif',
        fontWeight: 400,
        letterSpacing: '0.01em',
        lineHeight: 1.8,
        color: mode === 'light' ? '#000000' : '#FFFFFF',
        fontSize: '1rem',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
            color: mode === 'light' ? '#000000' : '#FFFFFF',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
            backgroundImage: 'none',
            maxWidth: '1400px !important',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '& .MuiToolbar-root': {
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 24px',
              '& .MuiBox-root': {
                '&:nth-of-type(1)': { // Logo section
                  flex: '0 0 200px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  '@media (max-width: 900px)': {
                    flex: '1',
                  }
                },
                '&:nth-of-type(2)': { // Menu button
                  display: 'none',
                  '@media (max-width: 900px)': {
                    display: 'flex',
                    marginLeft: 'auto',
                  }
                },
                '&:nth-of-type(3)': { // Mobile logo
                  display: 'none',
                },
                '&:nth-of-type(4)': { // Navigation buttons
                  flex: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  '@media (max-width: 900px)': {
                    display: 'none',
                  }
                },
                '&:nth-of-type(5)': { // Theme and profile
                  flex: '0 0 200px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  '@media (max-width: 900px)': {
                    display: 'none',
                  }
                }
              }
            }
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
            backgroundImage: 'none',
            borderBottom: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            boxShadow: 'none',
            height: '80px',
            borderRadius: 0,
            '& .MuiToolbar-root': {
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
              backgroundImage: 'none',
              padding: 0,
            },
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            backgroundColor: '#000000',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: '#000000',
            backgroundImage: 'none',
            borderRadius: 0,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            fontFamily: '"Unbounded", sans-serif',
            borderRadius: '12px',
            padding: '10px 24px',
            fontWeight: 500,
            fontSize: '0.9rem',
            letterSpacing: '0.01em',
            textTransform: 'none',
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
            color: mode === 'light' ? '#000000' : '#FFFFFF',
            border: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            transition: 'all 0.3s ease',
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
            },
            '& .MuiSvgIcon-root': {
              marginRight: '8px',
              color: mode === 'light' ? '#000000' : '#FFFFFF',
            }
          },
          contained: {
            backgroundColor: mode === 'light' ? '#000000' : '#FFFFFF',
            color: mode === 'light' ? '#FFFFFF' : '#000000',
            border: 'none',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#333333' : '#E0E0E0',
            }
          }
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: '#000000',
            backgroundImage: 'none',
            borderRadius: 0,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#000000',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused': {
                borderColor: '#FFFFFF',
                borderWidth: '1px',
              },
              '& input': {
                color: '#FFFFFF',
                fontSize: '1rem',
                fontFamily: '"Unbounded", sans-serif',
                padding: '16px',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#FFFFFF',
              fontSize: '1rem',
              fontFamily: '"Unbounded", sans-serif',
              '&.Mui-focused': {
                color: '#FFFFFF',
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#000000' : '#FFFFFF',
            transition: 'all 0.3s ease',
            padding: '8px',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
              backgroundImage: 'none',
            },
            '&.menu-button': {
              display: 'none',
              '@media (max-width: 900px)': {
                display: 'flex',
                marginLeft: '16px',
              }
            }
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
            backgroundImage: 'none',
            borderRadius: 0,
            borderLeft: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            width: '300px',
            padding: '24px',
            '& .MuiList-root': {
              padding: '24px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            },
            '& .drawer-header': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              padding: '0 16px',
            },
            '& .drawer-actions': {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderTop: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
              marginTop: 'auto',
            }
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: '24px 0',
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#000000',
            backgroundImage: 'none',
            '&.mobile-menu': {
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              '& .MuiListItem-root': {
                borderRadius: '12px',
                marginBottom: '4px',
                '& .MuiListItemIcon-root': {
                  minWidth: '40px',
                  color: mode === 'light' ? '#000000' : '#FFFFFF',
                },
                '& .MuiListItemText-primary': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }
            }
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
            borderRadius: '12px',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              backgroundImage: 'none',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
              },
            },
            '& .MuiListItemIcon-root': {
              color: mode === 'light' ? '#000000' : '#FFFFFF',
              minWidth: '40px',
            },
            '& .MuiListItemText-primary': {
              color: mode === 'light' ? '#000000' : '#FFFFFF',
              fontFamily: '"Unbounded", sans-serif',
              fontSize: '1rem',
              fontWeight: 500,
            }
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: mode === 'light' ? '#000000' : '#FFFFFF',
            fontFamily: '"Unbounded", sans-serif',
            fontSize: '1rem',
            fontWeight: 500,
          },
          secondary: {
            color: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem',
          }
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#000000' : '#FFFFFF',
            borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease-in-out',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '1rem',
            '&.Mui-selected': {
              backgroundColor: mode === 'light' ? '#1a73e8' : '#8ab4f8',
              color: mode === 'light' ? '#FFFFFF' : '#000000',
              borderColor: mode === 'light' ? '#1a73e8' : '#8ab4f8',
              fontWeight: 600,
              transform: 'scale(1.02)',
              boxShadow: mode === 'light' 
                ? '0 0 0 2px rgba(26, 115, 232, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)'
                : '0 0 0 2px rgba(138, 180, 248, 0.2), 0 4px 8px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: mode === 'light' ? '#1557b0' : '#93b4f8',
              }
            },
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              transform: 'scale(1.01)',
            }
          }
        }
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            gap: '12px',
            '& .MuiToggleButton-root': {
              border: `2px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: mode === 'light' ? '#000000' : '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '1rem',
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                backgroundColor: mode === 'light' ? '#1a73e8' : '#8ab4f8',
                borderColor: mode === 'light' ? '#1a73e8' : '#8ab4f8',
                color: mode === 'light' ? '#FFFFFF' : '#000000',
                fontWeight: 600,
                transform: 'scale(1.02)',
                boxShadow: mode === 'light' 
                  ? '0 0 0 2px rgba(26, 115, 232, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)'
                  : '0 0 0 2px rgba(138, 180, 248, 0.2), 0 4px 8px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  backgroundColor: mode === 'light' ? '#1557b0' : '#93b4f8',
                }
              },
              '&:hover': {
                backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                transform: 'scale(1.01)',
              }
            }
          }
        }
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiFormLabel-root': {
              color: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              '&.Mui-focused': {
                color: mode === 'light' ? '#000000' : '#FFFFFF',
              }
            }
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#000000' : '#FFFFFF',
            backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            '&:hover': {
              borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused': {
              borderColor: mode === 'light' ? '#000000' : '#FFFFFF',
              boxShadow: `0 0 0 2px ${mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            }
          }
        }
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 